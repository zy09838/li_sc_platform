import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, isAdmin } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { setCorsHeaders } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    const { status, month, year, page = '1', limit = '10' } = req.query;

    const where: any = {};

    if (status) {
      where.status = String(status);
    }

    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0);
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          _count: { select: { registrations: true } },
          votes: true
        },
        orderBy: { date: 'asc' },
        skip,
        take: Number(limit)
      }),
      prisma.activity.count({ where })
    ]);

    const formattedActivities = activities.map((a: any) => ({
      ...a,
      participants: a._count.registrations,
      hasVoting: a.votes.length > 0
    }));

    return res.status(200).json({
      success: true,
      data: {
        activities: formattedActivities,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    return res.status(500).json({ success: false, message: '获取活动列表失败' });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req);
  if (!user || !isAdmin(user)) {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }

  try {
    const {
      title, description, imageUrl, date, location,
      maxParticipants, isQuarterly, hasVoting, voteTitle, voteOptions
    } = req.body;

    const activity = await prisma.activity.create({
      data: {
        title: String(title),
        description: description ? String(description) : null,
        imageUrl: imageUrl ? String(imageUrl) : null,
        date: new Date(date),
        location: location ? String(location) : null,
        maxParticipants: maxParticipants ? Number(maxParticipants) : null,
        isQuarterly: Boolean(isQuarterly),
        hasVoting: Boolean(hasVoting),
        createdById: user.id
      }
    });

    if (hasVoting && voteOptions) {
      await prisma.activityVote.create({
        data: {
          activityId: activity.id,
          title: voteTitle ? String(voteTitle) : null,
          options: voteOptions
        }
      });
    }

    return res.status(201).json({ success: true, data: activity });
  } catch (error) {
    console.error('Create activity error:', error);
    return res.status(500).json({ success: false, message: '创建活动失败' });
  }
}
