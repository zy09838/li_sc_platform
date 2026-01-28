import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, isAdmin } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { setCorsHeaders } from '../../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user || !isAdmin(user)) {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }

  const { id } = req.query;
  const articleId = Array.isArray(id) ? id[0] : id;

  if (!articleId) {
    return res.status(400).json({ success: false, message: '缺少文章ID' });
  }

  try {
    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    const updated = await prisma.article.update({
      where: { id: articleId },
      data: { isTop: !article.isTop }
    });

    return res.status(200).json({
      success: true,
      data: { isTop: updated.isTop },
      message: updated.isTop ? '文章已置顶' : '已取消置顶'
    });
  } catch (error) {
    console.error('Pin article error:', error);
    return res.status(500).json({ success: false, message: '操作失败' });
  }
}
