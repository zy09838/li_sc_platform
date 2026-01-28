import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth, isAdmin } from './_lib/auth.js';
import { prisma } from './_lib/prisma.js';
import { setCorsHeaders } from './_lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, id } = req.query;

  switch (action) {
    case 'list':
      return handleList(req, res);
    case 'hot':
      return handleHot(req, res);
    case 'categories':
      return handleCategories(req, res);
    case 'detail':
      return handleDetail(req, res, id);
    case 'like':
      return handleLike(req, res, id);
    case 'pin':
      return handlePin(req, res, id);
    default:
      return res.status(400).json({ success: false, message: 'Invalid action' });
  }
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const { page = '1', limit = '10', category, tag, search, sort = 'latest' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const where: any = { status: 'published' };
      if (category) where.category = category;
      if (tag) where.tags = { has: tag as string };
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { summary: { contains: search as string, mode: 'insensitive' } }
        ];
      }
      let orderBy: any = { createdAt: 'desc' };
      if (sort === 'hot') orderBy = { views: 'desc' };

      const [topArticles, normalArticles, total] = await Promise.all([
        prisma.article.findMany({ where: { ...where, isTop: true }, include: { author: { select: { id: true, name: true, avatarUrl: true, role: true } } }, orderBy }),
        prisma.article.findMany({ where: { ...where, isTop: false }, include: { author: { select: { id: true, name: true, avatarUrl: true, role: true } } }, orderBy, skip, take: Number(limit) }),
        prisma.article.count({ where })
      ]);

      return res.status(200).json({
        success: true,
        data: { articles: [...topArticles, ...normalArticles], pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }
      });
    } catch (error) {
      console.error('Get articles error:', error);
      return res.status(500).json({ success: false, message: '获取文章列表失败' });
    }
  } else if (req.method === 'POST') {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ success: false, message: '未授权' });

    try {
      const { title, summary, content, category, tags, imageUrl, status = 'published' } = req.body;
      const article = await prisma.article.create({
        data: { title, summary, content, category, tags: tags || [], imageUrl, status, authorId: user.id, publishedAt: status === 'published' ? new Date() : null },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } }
      });

      if (status === 'published') {
        await prisma.$transaction([
          prisma.pointTransaction.create({ data: { userId: user.id, type: 'in', amount: 20, reason: `发布文章《${title}》`, relatedEntityType: 'article', relatedEntityId: article.id } }),
          prisma.user.update({ where: { id: user.id }, data: { points: { increment: 20 } } })
        ]);
      }
      return res.status(201).json({ success: true, data: article });
    } catch (error) {
      console.error('Create article error:', error);
      return res.status(500).json({ success: false, message: '创建文章失败' });
    }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function handleHot(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  try {
    const { limit = '5' } = req.query;
    const articles = await prisma.article.findMany({
      where: { status: 'published' }, orderBy: { views: 'desc' }, take: Number(limit),
      include: { author: { select: { id: true, name: true, avatarUrl: true } } }
    });
    return res.status(200).json({ success: true, data: articles });
  } catch (error) {
    console.error('Get hot articles error:', error);
    return res.status(500).json({ success: false, message: '获取热门文章失败' });
  }
}

async function handleCategories(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  try {
    const categories = await prisma.article.groupBy({ by: ['category'], _count: { id: true }, where: { status: 'published', category: { not: null } } });
    return res.status(200).json({ success: true, data: categories.map(c => ({ name: c.category, count: c._count.id })) });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ success: false, message: '获取分类失败' });
  }
}

async function handleDetail(req: VercelRequest, res: VercelResponse, id: string | string[] | undefined) {
  const articleId = Array.isArray(id) ? id[0] : id;
  if (!articleId) return res.status(400).json({ success: false, message: '缺少文章ID' });

  if (req.method === 'GET') {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true, role: true, department: true } },
          comments: { include: { author: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: 'desc' }, take: 10 },
          _count: { select: { comments: true, articleLikes: true } }
        }
      });
      if (!article) return res.status(404).json({ success: false, message: '文章不存在' });
      await prisma.article.update({ where: { id: articleId }, data: { views: { increment: 1 } } });

      let isLiked = false;
      const user = await verifyAuth(req);
      if (user) {
        const like = await prisma.articleLike.findUnique({ where: { articleId_userId: { articleId, userId: user.id } } });
        isLiked = !!like;
      }
      return res.status(200).json({ success: true, data: { ...article, isLiked } });
    } catch (error) {
      console.error('Get article error:', error);
      return res.status(500).json({ success: false, message: '获取文章失败' });
    }
  } else if (req.method === 'PUT') {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ success: false, message: '未授权' });
    try {
      const article = await prisma.article.findUnique({ where: { id: articleId } });
      if (!article) return res.status(404).json({ success: false, message: '文章不存在' });
      if (article.authorId !== user.id && !isAdmin(user)) return res.status(403).json({ success: false, message: '无权修改该文章' });

      const { title, summary, content, category, tags, imageUrl, status } = req.body;
      const updated = await prisma.article.update({
        where: { id: articleId }, data: { title, summary, content, category, tags, imageUrl, status },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } }
      });
      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('Update article error:', error);
      return res.status(500).json({ success: false, message: '更新文章失败' });
    }
  } else if (req.method === 'DELETE') {
    const user = await verifyAuth(req);
    if (!user) return res.status(401).json({ success: false, message: '未授权' });
    try {
      const article = await prisma.article.findUnique({ where: { id: articleId } });
      if (!article) return res.status(404).json({ success: false, message: '文章不存在' });
      if (article.authorId !== user.id && !isAdmin(user)) return res.status(403).json({ success: false, message: '无权删除该文章' });
      await prisma.article.delete({ where: { id: articleId } });
      return res.status(200).json({ success: true, message: '文章已删除' });
    } catch (error) {
      console.error('Delete article error:', error);
      return res.status(500).json({ success: false, message: '删除文章失败' });
    }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function handleLike(req: VercelRequest, res: VercelResponse, id: string | string[] | undefined) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ success: false, message: '未授权' });

  const articleId = Array.isArray(id) ? id[0] : id;
  if (!articleId) return res.status(400).json({ success: false, message: '缺少文章ID' });

  try {
    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return res.status(404).json({ success: false, message: '文章不存在' });

    const existingLike = await prisma.articleLike.findUnique({ where: { articleId_userId: { articleId, userId: user.id } } });

    if (existingLike) {
      await prisma.$transaction([
        prisma.articleLike.delete({ where: { id: existingLike.id } }),
        prisma.article.update({ where: { id: articleId }, data: { likes: { decrement: 1 } } })
      ]);
      return res.status(200).json({ success: true, data: { liked: false } });
    }

    await prisma.$transaction([
      prisma.articleLike.create({ data: { articleId, userId: user.id } }),
      prisma.article.update({ where: { id: articleId }, data: { likes: { increment: 1 } } }),
      prisma.notification.create({ data: { userId: article.authorId, type: 'like', title: '收到新的点赞', content: `${user.name} 点赞了你的文章《${article.title}》`, link: `/articles/${articleId}` } })
    ]);
    return res.status(200).json({ success: true, data: { liked: true } });
  } catch (error) {
    console.error('Like article error:', error);
    return res.status(500).json({ success: false, message: '操作失败' });
  }
}

async function handlePin(req: VercelRequest, res: VercelResponse, id: string | string[] | undefined) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const user = await verifyAuth(req);
  if (!user || !isAdmin(user)) return res.status(403).json({ success: false, message: '需要管理员权限' });

  const articleId = Array.isArray(id) ? id[0] : id;
  if (!articleId) return res.status(400).json({ success: false, message: '缺少文章ID' });

  try {
    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return res.status(404).json({ success: false, message: '文章不存在' });

    const updated = await prisma.article.update({ where: { id: articleId }, data: { isTop: !article.isTop } });
    return res.status(200).json({ success: true, data: { isTop: updated.isTop }, message: updated.isTop ? '文章已置顶' : '已取消置顶' });
  } catch (error) {
    console.error('Pin article error:', error);
    return res.status(500).json({ success: false, message: '操作失败' });
  }
}
