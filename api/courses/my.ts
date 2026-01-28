import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { setCorsHeaders } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  try {
    const progress = await prisma.userCourseProgress.findMany({
      where: { userId: user.id },
      include: { course: true },
      orderBy: { lastStudiedAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: progress });
  } catch (error) {
    console.error('Get my courses error:', error);
    return res.status(500).json({ success: false, message: '获取学习进度失败' });
  }
}
