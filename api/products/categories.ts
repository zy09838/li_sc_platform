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
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { status: 'active', category: { not: null } }
    });

    return res.status(200).json({
      success: true,
      data: categories.map(c => ({ name: c.category, count: c._count.id }))
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ success: false, message: '获取分类失败' });
  }
}
