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

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        avatarUrl: true,
        department: true,
        role: true,
        points: true,
        createdAt: true,
        _count: {
          select: {
            articles: true,
            comments: true,
            articleLikes: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
}
