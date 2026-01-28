import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { setCorsHeaders } from '../../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { id } = req.query;
  const wishId = Array.isArray(id) ? id[0] : id;

  if (!wishId) {
    return res.status(400).json({ success: false, message: '缺少心愿ID' });
  }

  try {
    const existing = await prisma.wishLike.findUnique({
      where: { wishId_userId: { wishId, userId: user.id } }
    });

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
