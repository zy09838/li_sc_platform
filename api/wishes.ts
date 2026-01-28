import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './_lib/auth.js';
import { prisma } from './_lib/prisma.js';
import { setCorsHeaders } from './_lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, id } = req.query;

  switch (action) {
    case 'list':
      return handleList(req, res);
    case 'like':
      return handleLike(req, res, id);
    case 'food':
      return handleFood(req, res);
    default:
      return res.status(400).json({ success: false, message: 'Invalid action' });
  }
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const { page = '1', limit = '20' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [wishes, total] = await Promise.all([
        prisma.wish.findMany({ include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
        prisma.wish.count()
      ]);

      const maskedWishes = wishes.map(w => ({ ...w, author: w.isAnonymous ? { id: w.author.id, name: '匿名' } : w.author }));
      return res.status(200).json({
        success: true,
        data: { wishes: maskedWishes, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }
      });
    } catch (error) {
      console.error('Get wishes error:', error);
      return res.status(500).json({ success: false, message: '获取心愿列表失败' });
    }
  } else if (req.method === 'POST') {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ success: false, message: '未授权' });

    try {
      const { content, isAnonymous = true, color } = req.body;
      const colors = ['bg-yellow-100', 'bg-pink-100', 'bg-blue-100', 'bg-green-100'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const wish = await prisma.wish.create({ data: { content, authorId: user.id, isAnonymous, color: color || randomColor } });
      return res.status(201).json({ success: true, data: wish });
    } catch (error) {
      console.error('Create wish error:', error);
      return res.status(500).json({ success: false, message: '发布心愿失败' });
    }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function handleLike(req: VercelRequest, res: VercelResponse, id: string | string[] | undefined) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ success: false, message: '未授权' });

  const wishId = Array.isArray(id) ? id[0] : id;
  if (!wishId) return res.status(400).json({ success: false, message: '缺少心愿ID' });

  try {
    const existing = await prisma.wishLike.findUnique({ where: { wishId_userId: { wishId, userId: user.id } } });

    if (existing) {
      await prisma.$transaction([
        prisma.wishLike.delete({ where: { id: existing.id } }),
        prisma.wish.update({ where: { id: wishId }, data: { likes: { decrement: 1 } } })
      ]);
      return res.status(200).json({ success: true, data: { liked: false } });
    }

    await prisma.$transaction([
      prisma.wishLike.create({ data: { wishId, userId: user.id } }),
      prisma.wish.update({ where: { id: wishId }, data: { likes: { increment: 1 } } })
    ]);
    return res.status(200).json({ success: true, data: { liked: true } });
  } catch (error) {
    console.error('Like wish error:', error);
    return res.status(500).json({ success: false, message: '操作失败' });
  }
}

async function handleFood(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const { page = '1', limit = '10' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [foods, total] = await Promise.all([
        prisma.foodRecommendation.findMany({ include: { recommender: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { rating: 'desc' }, skip, take: Number(limit) }),
        prisma.foodRecommendation.count()
      ]);

      return res.status(200).json({
        success: true,
        data: { foods, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }
      });
    } catch (error) {
      console.error('Get foods error:', error);
      return res.status(500).json({ success: false, message: '获取美食列表失败' });
    }
  } else if (req.method === 'POST') {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ success: false, message: '未授权' });

    try {
      const { name, rating, imageUrl, tags } = req.body;
      const food = await prisma.foodRecommendation.create({ data: { name, rating, imageUrl, tags: tags || [], recommenderId: user.id } });
      return res.status(201).json({ success: true, data: food });
    } catch (error) {
      console.error('Create food error:', error);
      return res.status(500).json({ success: false, message: '添加美食推荐失败' });
    }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
