import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, isAdmin } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { setCorsHeaders } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  const userId = Array.isArray(id) ? id[0] : id;

  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  if (req.method === 'GET') {
    return handleGet(userId, res);
  } else if (req.method === 'PUT') {
    return handlePut(req, userId, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function handleGet(userId: string, res: VercelResponse) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
}

async function handlePut(req: VercelRequest, userId: string, res: VercelResponse) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  // Only allow updating own profile or admin
  if (authUser.id !== userId && !isAdmin(authUser)) {
    return res.status(403).json({
      success: false,
      message: '无权修改该用户信息'
    });
  }

  try {
    const { name, avatarUrl, department } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, avatarUrl, department },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        avatarUrl: true,
        department: true,
        role: true,
        points: true
      }
    });

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ success: false, message: '更新用户信息失败' });
  }
}
