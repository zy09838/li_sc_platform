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
    const { scenario, search, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (scenario) where.scenario = scenario;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [prompts, total] = await Promise.all([
      prisma.aIPrompt.findMany({
        where,
        orderBy: { copyCount: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.aIPrompt.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        prompts,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
      }
    });
  } catch (error) {
    console.error('Get prompts error:', error);
    return res.status(500).json({ success: false, message: '获取 Prompt 列表失败' });
  }
}
