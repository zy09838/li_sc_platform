import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { setCorsHeaders } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    const {
      page = '1',
      limit = '10',
      category,
      tag,
      search,
      sort = 'latest'
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      status: 'published'
    };

    if (category) {
      where.category = category;
    }

    if (tag) {
      where.tags = { has: tag as string };
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { summary: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'hot') {
      orderBy = { views: 'desc' };
    }

    const [topArticles, normalArticles, total] = await Promise.all([
      prisma.article.findMany({
        where: { ...where, isTop: true },
        include: {
          author: {
            select: { id: true, name: true, avatarUrl: true, role: true }
          }
        },
        orderBy
      }),
      prisma.article.findMany({
        where: { ...where, isTop: false },
        include: {
          author: {
            select: { id: true, name: true, avatarUrl: true, role: true }
          }
        },
        orderBy,
        skip,
        take: Number(limit)
      }),
      prisma.article.count({ where })
    ]);

    const articles = [...topArticles, ...normalArticles];

    return res.status(200).json({
      success: true,
      data: {
        articles,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get articles error:', error);
    return res.status(500).json({ success: false, message: '获取文章列表失败' });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  try {
    const { title, summary, content, category, tags, imageUrl, status = 'published' } = req.body;

    const article = await prisma.article.create({
      data: {
        title,
        summary,
        content,
        category,
        tags: tags || [],
        imageUrl,
        status,
        authorId: user.id,
        publishedAt: status === 'published' ? new Date() : null
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true }
        }
      }
    });

    // Add points for publishing
    if (status === 'published') {
      await prisma.$transaction([
        prisma.pointTransaction.create({
          data: {
            userId: user.id,
            type: 'in',
            amount: 20,
            reason: `发布文章《${title}》`,
            relatedEntityType: 'article',
            relatedEntityId: article.id
          }
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { points: { increment: 20 } }
        })
      ]);
    }

    return res.status(201).json({ success: true, data: article });
  } catch (error) {
    console.error('Create article error:', error);
    return res.status(500).json({ success: false, message: '创建文章失败' });
  }
}
