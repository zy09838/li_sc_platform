import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { setCorsHeaders } from '../_lib/cors';

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

  try {
    const userId = user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingCheckin = await prisma.pointTransaction.findFirst({
      where: {
        userId,
        relatedEntityType: 'checkin',
        createdAt: {
          gte: today
        }
      }
    });

    if (existingCheckin) {
      return res.status(400).json({
        success: false,
        message: '今日已签到'
      });
    }

    // Create point transaction
    const reward = 10;

    await prisma.$transaction([
      prisma.pointTransaction.create({
        data: {
          userId,
          type: 'in',
          amount: reward,
          reason: '每日签到奖励',
          relatedEntityType: 'checkin'
        }
      }),
      prisma.user.update({
        where: { id: userId },
        data: { points: { increment: reward } }
      })
    ]);

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true }
    });

    return res.status(200).json({
      success: true,
      data: {
        reward,
        currentPoints: updatedUser?.points
      },
      message: `签到成功，获得 ${reward} 积分`
    });
  } catch (error) {
    console.error('Checkin error:', error);
    return res.status(500).json({ success: false, message: '签到失败' });
  }
}
