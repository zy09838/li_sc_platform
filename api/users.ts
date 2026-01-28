import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, isAdmin } from './_auth.js';
import { prisma } from './_prisma.js';
import { setCorsHeaders } from './_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, id } = req.query;

  switch (action) {
    case 'detail':
      return handleUserDetail(req, res, id);
    case 'checkin':
      return handleCheckin(req, res);
    case 'points':
      return handlePoints(req, res, id);
    case 'leaderboard':
      return handleLeaderboard(req, res);
    default:
      return res.status(400).json({ success: false, message: 'Invalid action' });
  }
}

async function handleUserDetail(req: VercelRequest, res: VercelResponse, id: string | string[] | undefined) {
  const userId = Array.isArray(id) ? id[0] : id;
  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, employeeId: true, name: true, email: true, avatarUrl: true, department: true, role: true, points: true, createdAt: true,
          _count: { select: { articles: true, comments: true, articleLikes: true } }
        }
      });

      if (!user) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }
      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({ success: false, message: '获取用户信息失败' });
    }
  } else if (req.method === 'PUT') {
    const authUser = await verifyAuth(req);
    if (!authUser) {
      return res.status(401).json({ success: false, message: '未授权' });
    }

    if (authUser.id !== userId && !isAdmin(authUser)) {
      return res.status(403).json({ success: false, message: '无权修改该用户信息' });
    }

    try {
      const { name, avatarUrl, department } = req.body;
      const user = await prisma.user.update({
        where: { id: userId },
        data: { name, avatarUrl, department },
        select: { id: true, employeeId: true, name: true, email: true, avatarUrl: true, department: true, role: true, points: true }
      });
      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ success: false, message: '更新用户信息失败' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function handleCheckin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingCheckin = await prisma.pointTransaction.findFirst({
      where: { userId: user.id, relatedEntityType: 'checkin', createdAt: { gte: today } }
    });

    if (existingCheckin) {
      return res.status(400).json({ success: false, message: '今日已签到' });
    }

    const reward = 10;
    await prisma.$transaction([
      prisma.pointTransaction.create({
        data: { userId: user.id, type: 'in', amount: reward, reason: '每日签到奖励', relatedEntityType: 'checkin' }
      }),
      prisma.user.update({ where: { id: user.id }, data: { points: { increment: reward } } })
    ]);

    const updatedUser = await prisma.user.findUnique({ where: { id: user.id }, select: { points: true } });
    return res.status(200).json({ success: true, data: { reward, currentPoints: updatedUser?.points }, message: `签到成功，获得 ${reward} 积分` });
  } catch (error) {
    console.error('Checkin error:', error);
    return res.status(500).json({ success: false, message: '签到失败' });
  }
}

async function handlePoints(req: VercelRequest, res: VercelResponse, id: string | string[] | undefined) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const userId = Array.isArray(id) ? id[0] : id;
  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  if (authUser.id !== userId && !isAdmin(authUser)) {
    return res.status(403).json({ success: false, message: '无权查看该用户积分' });
  }

  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [transactions, total] = await Promise.all([
      prisma.pointTransaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
      prisma.pointTransaction.count({ where: { userId } })
    ]);

    return res.status(200).json({
      success: true,
      data: { transactions, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }
    });
  } catch (error) {
    console.error('Get points error:', error);
    return res.status(500).json({ success: false, message: '获取积分记录失败' });
  }
}

async function handleLeaderboard(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { limit = '10' } = req.query;
    const users = await prisma.user.findMany({
      orderBy: { points: 'desc' },
      take: Number(limit),
      select: { id: true, name: true, avatarUrl: true, points: true, department: true }
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
