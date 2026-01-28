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
    const paths = await prisma.learningPath.findMany();
    return res.status(200).json({ success: true, data: paths });
  } catch (error) {
    console.error('Get learning paths error:', error);
    return res.status(500).json({ success: false, message: '获取学习路径失败' });
  }
}
