import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../_lib/prisma';
import { setCorsHeaders } from '../../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { limit = '10' } = req.query;

    const users = await prisma.user.findMany({
      orderBy: { points: 'desc' },
      take: Number(limit),
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        points: true,
        department: true
      }
    });

    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1,
      medal: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'none'
    }));

    return res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return res.status(500).json({ success: false, message: '获取排行榜失败' });
  }
}
