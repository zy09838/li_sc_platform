import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { setCorsHeaders } from '../../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { id } = req.query;
  const courseId = Array.isArray(id) ? id[0] : id;

  if (!courseId) {
    return res.status(400).json({ success: false, message: '缺少课程ID' });
  }

  try {
    const { progress } = req.body;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ success: false, message: '课程不存在' });
    }

    const existing = await prisma.userCourseProgress.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } }
    });

    const isNewCompletion = progress >= 100 && (!existing || existing.progress < 100);

    const updated = await prisma.userCourseProgress.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      create: {
        userId: user.id,
        courseId,
        progress,
        lastStudiedAt: new Date(),
        completedAt: progress >= 100 ? new Date() : null
      },
      update: {
        progress,
        lastStudiedAt: new Date(),
        completedAt: progress >= 100 ? new Date() : undefined
      }
    });

    if (isNewCompletion) {
      await prisma.$transaction([
        prisma.pointTransaction.create({
          data: {
            userId: user.id,
            type: 'in',
            amount: 50,
            reason: `完成课程《${course.title}》`,
            relatedEntityType: 'course',
            relatedEntityId: courseId
          }
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { points: { increment: 50 } }
        })
      ]);
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update progress error:', error);
    return res.status(500).json({ success: false, message: '更新进度失败' });
  }
}
