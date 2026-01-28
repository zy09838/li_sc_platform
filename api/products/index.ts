import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { setCorsHeaders } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { category, page = '1', limit = '12' } = req.query;

    const where: any = { status: 'active' };
    if (category) where.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ isHot: 'desc' }, { isNew: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: Number(limit)
      }),
      prisma.product.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ success: false, message: '获取商品列表失败' });
  }
}
