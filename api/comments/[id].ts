import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, isAdmin } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { setCorsHeaders } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { id } = req.query;
  const commentId = Array.isArray(id) ? id[0] : id;

  if (!commentId) {
    return res.status(400).json({ success: false, message: '缺少评论ID' });
  }

  try {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      return res.status(404).json({ success: false, message: '评论不存在' });
    }

    if (comment.authorId !== user.id && !isAdmin(user)) {
      return res.status(403).json({ success: false, message: '无权删除该评论' });
    }

    await prisma.$transaction([
      prisma.comment.delete({ where: { id: commentId } }),
      prisma.article.update({
        where: { id: comment.articleId },
        data: { commentsCount: { decrement: 1 } }
      })
    ]);

    return res.status(200).json({ success: true, message: '评论已删除' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({ success: false, message: '删除评论失败' });
  }
}
