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
    const { category } = req.query;

    const where: any = {};
    if (category) where.category = category;

    const tools = await prisma.aITool.findMany({
      where,
      orderBy: { clickCount: 'desc' }
    });

    return res.status(200).json({ success: true, data: tools });
  } catch (error) {
    console.error('Get AI tools error:', error);
    return res.status(500).json({ success: false, message: '获取 AI 工具列表失败' });
  }
}
