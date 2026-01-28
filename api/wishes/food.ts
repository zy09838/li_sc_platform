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
    const { page = '1', limit = '10' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [foods, total] = await Promise.all([
      prisma.foodRecommendation.findMany({
        include: {
          recommender: { select: { id: true, name: true, avatarUrl: true } }
        },
        orderBy: { rating: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.foodRecommendation.count()
    ]);

    return res.status(200).json({
      success: true,
      data: {
        foods,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
      }
    });
  } catch (error) {
    console.error('Get foods error:', error);
    return res.status(500).json({ success: false, message: '获取美食列表失败' });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  try {
    const { name, rating, imageUrl, tags } = req.body;

    const food = await prisma.foodRecommendation.create({
      data: {
        name,
        rating,
        imageUrl,
        tags: tags || [],
        recommenderId: user.id
      }
    });

    return res.status(201).json({ success: true, data: food });
  } catch (error) {
    console.error('Create food error:', error);
    return res.status(500).json({ success: false, message: '添加美食推荐失败' });
  }
}
