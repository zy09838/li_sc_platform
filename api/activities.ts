import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, isAdmin } from './_lib/auth';
import { prisma } from './_lib/prisma';
import { setCorsHeaders } from './_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, id } = req.query;

  switch (action) {
    case 'list':
      return handleList(req, res);
    case 'calendar':
      return handleCalendar(req, res);
    case 'detail':
      return handleDetail(req, res, id);
    case 'register':
      return handleRegister(req, res, id);
    case 'vote':
      return handleVote(req, res, id);
    default:
      return res.status(400).json({ success: false, message: 'Invalid action' });
  }
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const { status, month, year, page = '1', limit = '10' } = req.query;
      const where: any = {};
      if (status) where.status = String(status);
      if (month && year) {
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0);
        where.date = { gte: startDate, lte: endDate };
      }
      const skip = (Number(page) - 1) * Number(limit);

      const [activities, total] = await Promise.all([
        prisma.activity.findMany({ where, include: { _count: { select: { registrations: true } }, votes: true }, orderBy: { date: 'asc' }, skip, take: Number(limit) }),
        prisma.activity.count({ where })
      ]);

      const formattedActivities = activities.map((a: any) => ({ ...a, participants: a._count.registrations, hasVoting: a.votes.length > 0 }));
      return res.status(200).json({
        success: true,
        data: { activities: formattedActivities, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }
      });
    } catch (error) {
      console.error('Get activities error:', error);
      return res.status(500).json({ success: false, message: '获取活动列表失败' });
    }
  } else if (req.method === 'POST') {
    const user = await verifyAuth(req);
    if (!user || !isAdmin(user)) return res.status(403).json({ success: false, message: '需要管理员权限' });

    try {
      const { title, description, imageUrl, date, location, maxParticipants, isQuarterly, hasVoting, voteTitle, voteOptions } = req.body;
      const activity = await prisma.activity.create({
        data: { title: String(title), description: description ? String(description) : null, imageUrl: imageUrl ? String(imageUrl) : null, date: new Date(date), location: location ? String(location) : null, maxParticipants: maxParticipants ? Number(maxParticipants) : null, isQuarterly: Boolean(isQuarterly), hasVoting: Boolean(hasVoting), createdById: user.id }
      });

      if (hasVoting && voteOptions) {
        await prisma.activityVote.create({ data: { activityId: activity.id, title: voteTitle ? String(voteTitle) : null, options: voteOptions } });
      }
      return res.status(201).json({ success: true, data: activity });
    } catch (error) {
      console.error('Create activity error:', error);
      return res.status(500).json({ success: false, message: '创建活动失败' });
    }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function handleCalendar(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  try {
    const { month, year } = req.query;
    const currentYear = year ? Number(year) : new Date().getFullYear();
    const currentMonth = month ? Number(month) - 1 : new Date().getMonth();
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    const activities = await prisma.activity.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      select: { id: true, title: true, date: true, status: true }
    });

    const calendarData: Record<string, any[]> = {};
    activities.forEach((a: any) => {
      const dateKey = a.date.toISOString().split('T')[0];
      if (!calendarData[dateKey]) calendarData[dateKey] = [];
      calendarData[dateKey].push(a);
    });
    return res.status(200).json({ success: true, data: calendarData });
  } catch (error) {
    console.error('Get calendar error:', error);
    return res.status(500).json({ success: false, message: '获取日历数据失败' });
  }
}

async function handleDetail(req: VercelRequest, res: VercelResponse, id: string | string[] | undefined) {
  const activityId = Array.isArray(id) ? id[0] : id;
  if (!activityId) return res.status(400).json({ success: false, message: '缺少活动ID' });

  if (req.method === 'GET') {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ success: false, message: '未授权' });
    try {
      const activity: any = await prisma.activity.findUnique({
        where: { id: activityId },
        include: { createdBy: { select: { id: true, name: true, avatarUrl: true } }, _count: { select: { registrations: true } }, votes: true }
      });
      if (!activity) return res.status(404).json({ success: false, message: '活动不存在' });

      const registration = await prisma.activityRegistration.findUnique({ where: { activityId_userId: { activityId, userId: user.id } } });
      let userVotedOptionId = null;
      if (activity.votes && activity.votes.length > 0) {
        const userVote = await prisma.userVote.findFirst({ where: { voteId: activity.votes[0].id, userId: user.id } });
        userVotedOptionId = userVote?.optionId;
      }
      return res.status(200).json({ success: true, data: { ...activity, participants: activity._count.registrations, isRegistered: !!registration, userVotedOptionId } });
    } catch (error) {
      console.error('Get activity error:', error);
      return res.status(500).json({ success: false, message: '获取活动详情失败' });
    }
  } else if (req.method === 'PUT') {
    const user = await verifyAuth(req);
    if (!user || !isAdmin(user)) return res.status(403).json({ success: false, message: '需要管理员权限' });
    try {
      const { title, description, imageUrl, date, location, status, maxParticipants } = req.body;
      const activity = await prisma.activity.update({
        where: { id: activityId },
        data: { title: title ? String(title) : undefined, description: description !== undefined ? String(description) : undefined, imageUrl: imageUrl !== undefined ? String(imageUrl) : undefined, date: date ? new Date(date) : undefined, location: location !== undefined ? String(location) : undefined, status: status ? String(status) : undefined, maxParticipants: maxParticipants !== undefined ? Number(maxParticipants) : undefined }
      });
      return res.status(200).json({ success: true, data: activity });
    } catch (error) {
      console.error('Update activity error:', error);
      return res.status(500).json({ success: false, message: '更新活动失败' });
    }
  } else if (req.method === 'DELETE') {
    const user = await verifyAuth(req);
    if (!user || !isAdmin(user)) return res.status(403).json({ success: false, message: '需要管理员权限' });
    try {
      await prisma.activity.delete({ where: { id: activityId } });
      return res.status(200).json({ success: true, message: '活动已删除' });
    } catch (error) {
      console.error('Delete activity error:', error);
      return res.status(500).json({ success: false, message: '删除活动失败' });
    }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function handleRegister(req: VercelRequest, res: VercelResponse, id: string | string[] | undefined) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ success: false, message: '未授权' });

  const activityId = Array.isArray(id) ? id[0] : id;
  if (!activityId) return res.status(400).json({ success: false, message: '缺少活动ID' });

  try {
    const activity: any = await prisma.activity.findUnique({ where: { id: activityId }, include: { _count: { select: { registrations: true } } } });
    if (!activity) return res.status(404).json({ success: false, message: '活动不存在' });
    if (activity.status === 'ended') return res.status(400).json({ success: false, message: '活动已结束' });
    if (activity.maxParticipants && activity._count.registrations >= activity.maxParticipants) return res.status(400).json({ success: false, message: '报名人数已满' });

    const existing = await prisma.activityRegistration.findUnique({ where: { activityId_userId: { activityId, userId: user.id } } });
    if (existing) {
      await prisma.activityRegistration.delete({ where: { id: existing.id } });
      return res.status(200).json({ success: true, data: { registered: false }, message: '已取消报名' });
    }

    await prisma.activityRegistration.create({ data: { activityId, userId: user.id } });
    return res.status(200).json({ success: true, data: { registered: true }, message: '报名成功' });
  } catch (error) {
    console.error('Register activity error:', error);
    return res.status(500).json({ success: false, message: '报名失败' });
  }
}

async function handleVote(req: VercelRequest, res: VercelResponse, id: string | string[] | undefined) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ success: false, message: '未授权' });

  const activityId = Array.isArray(id) ? id[0] : id;
  if (!activityId) return res.status(400).json({ success: false, message: '缺少活动ID' });

  try {
    const { optionId } = req.body;
    const activity: any = await prisma.activity.findUnique({ where: { id: activityId }, include: { votes: true } });
    if (!activity || !activity.votes || activity.votes.length === 0) return res.status(404).json({ success: false, message: '投票不存在' });

    const vote = activity.votes[0];
    const existing = await prisma.userVote.findUnique({ where: { voteId_userId: { voteId: vote.id, userId: user.id } } });
    if (existing) return res.status(400).json({ success: false, message: '您已投过票' });

    await prisma.userVote.create({ data: { voteId: vote.id, userId: user.id, optionId: String(optionId) } });

    const options = vote.options as any[];
    const updatedOptions = options.map((opt: any) => opt.id === optionId ? { ...opt, count: (opt.count || 0) + 1 } : opt);
    await prisma.activityVote.update({ where: { id: vote.id }, data: { options: updatedOptions } });

    return res.status(200).json({ success: true, message: '投票成功' });
  } catch (error) {
    console.error('Vote error:', error);
    return res.status(500).json({ success: false, message: '投票失败' });
  }
}
