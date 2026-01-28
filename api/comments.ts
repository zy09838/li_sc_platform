import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, isAdmin } from '../src/lib/auth.js';
import { prisma } from '../src/lib/prisma.js';
import { setCorsHeaders } from '../src/lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, id } = req.query;

  switch (action) {
    case 'list':
      return handleList(req, res);
    case 'delete':
      return handleDelete(req, res, id);
    default:
      return res.status(400).json({ success: false, message: 'Invalid action' });
  }
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const { articleId, page = '1', limit = '20' } = req.query;
      if (!articleId) return res.status(400).json({ success: false, message: '请提供文章ID' });

      const skip = (Number(page) - 1) * Number(limit);
      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: { articleId: articleId as string, parentId: null },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            replies: { include: { author: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: 'asc' } }
          },
          orderBy: { createdAt: 'desc' }, skip, take: Number(limit)
        }),
        prisma.comment.count({ where: { articleId: articleId as string, parentId: null } })
      ]);

      return res.status(200).json({
        success: true,
        data: { comments, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }
      });
    } catch (error) {
      console.error('Get comments error:', error);
      return res.status(500).json({ success: false, message: '获取评论失败' });
    }
  } else if (req.method === 'POST') {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ success: false, message: '未授权' });

    try {
      const { articleId, content, parentId } = req.body;
      if (!articleId || !content) return res.status(400).json({ success: false, message: '请提供文章ID和评论内容' });

      const article = await prisma.article.findUnique({ where: { id: articleId } });
      if (!article) return res.status(404).json({ success: false, message: '文章不存在' });

      const [comment] = await prisma.$transaction([
        prisma.comment.create({
          data: { content, articleId, authorId: user.id, parentId },
          include: { author: { select: { id: true, name: true, avatarUrl: true } } }
        }),
        prisma.article.update({ where: { id: articleId }, data: { commentsCount: { increment: 1 } } }),
        prisma.notification.create({
          data: { userId: article.authorId, type: 'comment', title: '收到新评论', content: `${user.name} 评论了你的文章《${article.title}》: "${content.substring(0, 50)}..."`, link: `/articles/${articleId}` }
        })
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayComment = await prisma.comment.findFirst({
        where: { authorId: user.id, createdAt: { gte: today }, id: { not: comment.id } }
      });

      if (!todayComment) {
        await prisma.$transaction([
          prisma.pointTransaction.create({ data: { userId: user.id, type: 'in', amount: 5, reason: '每日首次评论奖励', relatedEntityType: 'comment', relatedEntityId: comment.id } }),
          prisma.user.update({ where: { id: user.id }, data: { points: { increment: 5 } } })
        ]);
      }
      return res.status(201).json({ success: true, data: comment });
    } catch (error) {
      console.error('Create comment error:', error);
      return res.status(500).json({ success: false, message: '评论失败' });
    }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function handleDelete(req: VercelRequest, res: VercelResponse, id: string | string[] | undefined) {
  if (req.method !== 'DELETE') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ success: false, message: '未授权' });

  const commentId = Array.isArray(id) ? id[0] : id;
  if (!commentId) return res.status(400).json({ success: false, message: '缺少评论ID' });

  try {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ success: false, message: '评论不存在' });
    if (comment.authorId !== user.id && !isAdmin(user)) return res.status(403).json({ success: false, message: '无权删除该评论' });

    await prisma.$transaction([
      prisma.comment.delete({ where: { id: commentId } }),
      prisma.article.update({ where: { id: comment.articleId }, data: { commentsCount: { decrement: 1 } } })
    ]);
    return res.status(200).json({ success: true, message: '评论已删除' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({ success: false, message: '删除评论失败' });
  }
}
