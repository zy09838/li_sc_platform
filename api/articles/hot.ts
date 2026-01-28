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
    const { limit = '5' } = req.query;

    const articles = await prisma.article.findMany({
      where: { status: 'published' },
      orderBy: { views: 'desc' },
      take: Number(limit),
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true }
        }
      }
    });

    return res.status(200).json({ success: true, data: articles });
  } catch (error) {
    console.error('Get hot articles error:', error);
    return res.status(500).json({ success: false, message: '获取热门文章失败' });
  }
}
