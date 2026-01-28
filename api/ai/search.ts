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
    const { q, type } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: '请提供搜索关键词' });
    }

    const query = q as string;
    const results: any = {};

    if (!type || type === 'articles') {
      results.articles = await prisma.article.findMany({
        where: {
          status: 'published',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { summary: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: { id: true, title: true, summary: true, category: true }
      });
    }

    if (!type || type === 'courses') {
      results.courses = await prisma.course.findMany({
        where: {
          status: 'active',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: { id: true, title: true, instructor: true, category: true }
      });
    }

    if (!type || type === 'docs') {
      results.docs = await prisma.knowledgeDoc.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: { id: true, title: true, fileType: true, category: true }
      });
    }

    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ success: false, message: '搜索失败' });
  }
}
