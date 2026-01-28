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
  const activityId = Array.isArray(id) ? id[0] : id;

  if (!activityId) {
    return res.status(400).json({ success: false, message: '缺少活动ID' });
  }

  try {
    const activity: any = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { _count: { select: { registrations: true } } }
    });

    if (!activity) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }

    if (activity.status === 'ended') {
      return res.status(400).json({ success: false, message: '活动已结束' });
    }

    if (activity.maxParticipants && activity._count.registrations >= activity.maxParticipants) {
      return res.status(400).json({ success: false, message: '报名人数已满' });
    }

    const existing = await prisma.activityRegistration.findUnique({
      where: { activityId_userId: { activityId, userId: user.id } }
    });

    if (existing) {
      await prisma.activityRegistration.delete({ where: { id: existing.id } });
      return res.status(200).json({ success: true, data: { registered: false }, message: '已取消报名' });
    }

    await prisma.activityRegistration.create({
      data: { activityId, userId: user.id }
    });

    return res.status(200).json({ success: true, data: { registered: true }, message: '报名成功' });
  } catch (error) {
    console.error('Register activity error:', error);
    return res.status(500).json({ success: false, message: '报名失败' });
  }
}
