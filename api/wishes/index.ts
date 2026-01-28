import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth';
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
    const { page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [wishes, total] = await Promise.all([
      prisma.wish.findMany({
        include: {
          author: {
            select: { id: true, name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.wish.count()
    ]);

    const maskedWishes = wishes.map(w => ({
      ...w,
      author: w.isAnonymous ? { id: w.author.id, name: '匿名' } : w.author
    }));

    return res.status(200).json({
      success: true,
      data: {
        wishes: maskedWishes,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
      }
    });
  } catch (error) {
    console.error('Get wishes error:', error);
    return res.status(500).json({ success: false, message: '获取心愿列表失败' });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  try {
    const { content, isAnonymous = true, color } = req.body;

    const colors = ['bg-yellow-100', 'bg-pink-100', 'bg-blue-100', 'bg-green-100'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const wish = await prisma.wish.create({
      data: {
        content,
        authorId: user.id,
        isAnonymous,
        color: color || randomColor
      }
    });

    return res.status(201).json({ success: true, data: wish });
  } catch (error) {
    console.error('Create wish error:', error);
    return res.status(500).json({ success: false, message: '发布心愿失败' });
  }
}
