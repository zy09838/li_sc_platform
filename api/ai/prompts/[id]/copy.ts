import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../../../_lib/prisma';
import { setCorsHeaders } from '../../../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id } = req.query;
  const promptId = Array.isArray(id) ? id[0] : id;

  if (!promptId) {
    return res.status(400).json({ success: false, message: '缺少 Prompt ID' });
  }

  try {
    const prompt = await prisma.aIPrompt.update({
      where: { id: promptId },
      data: { copyCount: { increment: 1 } }
    });

    return res.status(200).json({ success: true, data: { content: prompt.content } });
  } catch (error) {
    console.error('Record copy error:', error);
    return res.status(500).json({ success: false, message: '操作失败' });
  }
}
