import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, isAdmin } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { setCorsHeaders } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  const activityId = Array.isArray(id) ? id[0] : id;

  if (!activityId) {
    return res.status(400).json({ success: false, message: '缺少活动ID' });
  }

  if (req.method === 'GET') {
    return handleGet(req, activityId, res);
  } else if (req.method === 'PUT') {
    return handlePut(req, activityId, res);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, activityId, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function handleGet(req: VercelRequest, activityId: string, res: VercelResponse) {
  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  try {
    const activity: any = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        createdBy: {
          select: { id: true, name: true, avatarUrl: true }
        },
        _count: { select: { registrations: true } },
        votes: true
      }
    });

    if (!activity) {
      return res.status(404).json({ success: false, message: '活动不存在' });
    }

    const registration = await prisma.activityRegistration.findUnique({
      where: {
        activityId_userId: { activityId, userId: user.id }
      }
    });

    let userVotedOptionId = null;
    if (activity.votes && activity.votes.length > 0) {
      const userVote = await prisma.userVote.findFirst({
        where: {
          voteId: activity.votes[0].id,
          userId: user.id
        }
      });
      userVotedOptionId = userVote?.optionId;
    }

    return res.status(200).json({
      success: true,
      data: {
        ...activity,
        participants: activity._count.registrations,
        isRegistered: !!registration,
        userVotedOptionId
      }
    });
  } catch (error) {
    console.error('Get activity error:', error);
    return res.status(500).json({ success: false, message: '获取活动详情失败' });
  }
}

async function handlePut(req: VercelRequest, activityId: string, res: VercelResponse) {
  const user = await verifyAuth(req);
  if (!user || !isAdmin(user)) {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }

  try {
    const { title, description, imageUrl, date, location, status, maxParticipants } = req.body;

    const activity = await prisma.activity.update({
      where: { id: activityId },
      data: {
        title: title ? String(title) : undefined,
        description: description !== undefined ? String(description) : undefined,
        imageUrl: imageUrl !== undefined ? String(imageUrl) : undefined,
        date: date ? new Date(date) : undefined,
        location: location !== undefined ? String(location) : undefined,
        status: status ? String(status) : undefined,
        maxParticipants: maxParticipants !== undefined ? Number(maxParticipants) : undefined
      }
    });

    return res.status(200).json({ success: true, data: activity });
  } catch (error) {
    console.error('Update activity error:', error);
    return res.status(500).json({ success: false, message: '更新活动失败' });
  }
}

async function handleDelete(req: VercelRequest, activityId: string, res: VercelResponse) {
  const user = await verifyAuth(req);
  if (!user || !isAdmin(user)) {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }

  try {
    await prisma.activity.delete({ where: { id: activityId } });
    return res.status(200).json({ success: true, message: '活动已删除' });
  } catch (error) {
    console.error('Delete activity error:', error);
    return res.status(500).json({ success: false, message: '删除活动失败' });
  }
}
