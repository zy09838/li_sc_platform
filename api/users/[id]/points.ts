import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, isAdmin } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { setCorsHeaders } from '../../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { id } = req.query;
  const userId = Array.isArray(id) ? id[0] : id;

  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  // Only allow viewing own points or admin
  if (authUser.id !== userId && !isAdmin(authUser)) {
    return res.status(403).json({
      success: false,
      message: '无权查看该用户积分'
    });
  }

  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      prisma.pointTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.pointTransaction.count({ where: { userId } })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get points error:', error);
    return res.status(500).json({ success: false, message: '获取积分记录失败' });
  }
}
