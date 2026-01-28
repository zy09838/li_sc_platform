import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, isAdmin } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { setCorsHeaders } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  const articleId = Array.isArray(id) ? id[0] : id;

  if (!articleId) {
    return res.status(400).json({ success: false, message: '缺少文章ID' });
  }

  if (req.method === 'GET') {
    return handleGet(req, articleId, res);
  } else if (req.method === 'PUT') {
    return handlePut(req, articleId, res);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, articleId, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function handleGet(req: VercelRequest, articleId: string, res: VercelResponse) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, role: true, department: true }
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: { comments: true, articleLikes: true }
        }
      }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }

    // Increment view count
    await prisma.article.update({
      where: { id: articleId },
      data: { views: { increment: 1 } }
    });

    // Check if current user liked
    let isLiked = false;
    const user = await verifyAuth(req);
    if (user) {
      const like = await prisma.articleLike.findUnique({
        where: {
          articleId_userId: { articleId, userId: user.id }
        }
      });
      isLiked = !!like;
    }

    return res.status(200).json({
      success: true,
      data: {
        ...article,
        isLiked
      }
    });
  } catch (error) {
    console.error('Get article error:', error);
    return res.status(500).json({ success: false, message: '获取文章失败' });
  }
}

async function handlePut(req: VercelRequest, articleId: string, res: VercelResponse) {
  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  try {
    const article = await prisma.article.findUnique({ where: { id: articleId } });

    if (!article) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    if (article.authorId !== user.id && !isAdmin(user)) {
      return res.status(403).json({ success: false, message: '无权修改该文章' });
    }

    const { title, summary, content, category, tags, imageUrl, status } = req.body;

    const updated = await prisma.article.update({
      where: { id: articleId },
      data: { title, summary, content, category, tags, imageUrl, status },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update article error:', error);
    return res.status(500).json({ success: false, message: '更新文章失败' });
  }
}

async function handleDelete(req: VercelRequest, articleId: string, res: VercelResponse) {
  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  try {
    const article = await prisma.article.findUnique({ where: { id: articleId } });

    if (!article) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    if (article.authorId !== user.id && !isAdmin(user)) {
      return res.status(403).json({ success: false, message: '无权删除该文章' });
    }

    await prisma.article.delete({ where: { id: articleId } });

    return res.status(200).json({ success: true, message: '文章已删除' });
  } catch (error) {
    console.error('Delete article error:', error);
    return res.status(500).json({ success: false, message: '删除文章失败' });
  }
}
