import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, optionalAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/articles - 获取文章列表
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            tag,
            search,
            sort = 'latest' // latest, hot, top
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

        // Top articles first
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

        res.json({
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
        res.status(500).json({ success: false, message: '获取文章列表失败' });
    }
});

// GET /api/articles/hot - 获取热门文章
router.get('/hot', async (req, res) => {
    try {
        const { limit = 5 } = req.query;

        const articles = await prisma.article.findMany({
            where: { status: 'published' },
            orderBy: { views: 'desc' },
            take: Number(limit),
            include: {
                author: {
                    select: { id: true, name: true, avatarUrl: true }
                }
            }
        });

        res.json({ success: true, data: articles });
    } catch (error) {
        console.error('Get hot articles error:', error);
        res.status(500).json({ success: false, message: '获取热门文章失败' });
    }
});

// GET /api/articles/categories - 获取文章分类
router.get('/categories', async (req, res) => {
    try {
        const categories = await prisma.article.groupBy({
            by: ['category'],
            _count: { id: true },
            where: {
                status: 'published',
                category: { not: null }
            }
        });

        res.json({
            success: true,
            data: categories.map(c => ({
                name: c.category,
                count: c._count.id
            }))
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, message: '获取分类失败' });
    }
});

// GET /api/articles/:id - 获取文章详情
router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const article = await prisma.article.findUnique({
            where: { id: String(id) },
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
            where: { id: String(id) },
            data: { views: { increment: 1 } }
        });

        // Check if current user liked
        let isLiked = false;
        if (req.user) {
            const like = await prisma.articleLike.findUnique({
                where: {
                    articleId_userId: { articleId: String(id), userId: req.user.id }
                }
            });
            isLiked = !!like;
        }

        res.json({
            success: true,
            data: {
                ...article,
                isLiked
            }
        });
    } catch (error) {
        console.error('Get article error:', error);
        res.status(500).json({ success: false, message: '获取文章失败' });
    }
});

// POST /api/articles - 创建文章
router.post('/', authenticate, async (req: AuthRequest, res) => {
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
                authorId: req.user!.id,
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
                        userId: req.user!.id,
                        type: 'in',
                        amount: 20,
                        reason: `发布文章《${title}》`,
                        relatedEntityType: 'article',
                        relatedEntityId: article.id
                    }
                }),
                prisma.user.update({
                    where: { id: req.user!.id },
                    data: { points: { increment: 20 } }
                })
            ]);
        }

        res.status(201).json({ success: true, data: article });
    } catch (error) {
        console.error('Create article error:', error);
        res.status(500).json({ success: false, message: '创建文章失败' });
    }
});

// PUT /api/articles/:id - 更新文章
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { title, summary, content, category, tags, imageUrl, status } = req.body;

        const article = await prisma.article.findUnique({ where: { id: String(id) } });

        if (!article) {
            return res.status(404).json({ success: false, message: '文章不存在' });
        }

        // Only author or admin can update
        if (article.authorId !== req.user!.id && req.user!.role !== 'admin') {
            return res.status(403).json({ success: false, message: '无权修改该文章' });
        }

        const updated = await prisma.article.update({
            where: { id: String(id) },
            data: { title, summary, content, category, tags, imageUrl, status },
            include: {
                author: { select: { id: true, name: true, avatarUrl: true } }
            }
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Update article error:', error);
        res.status(500).json({ success: false, message: '更新文章失败' });
    }
});

// DELETE /api/articles/:id - 删除文章
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const article = await prisma.article.findUnique({ where: { id: String(id) } });

        if (!article) {
            return res.status(404).json({ success: false, message: '文章不存在' });
        }

        if (article.authorId !== req.user!.id && req.user!.role !== 'admin') {
            return res.status(403).json({ success: false, message: '无权删除该文章' });
        }

        await prisma.article.delete({ where: { id: String(id) } });

        res.json({ success: true, message: '文章已删除' });
    } catch (error) {
        console.error('Delete article error:', error);
        res.status(500).json({ success: false, message: '删除文章失败' });
    }
});

// POST /api/articles/:id/like - 点赞文章
router.post('/:id/like', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const article = await prisma.article.findUnique({ where: { id: String(id) } });
        if (!article) {
            return res.status(404).json({ success: false, message: '文章不存在' });
        }

        const existingLike = await prisma.articleLike.findUnique({
            where: { articleId_userId: { articleId: String(id), userId } }
        });

        if (existingLike) {
            // Unlike
            await prisma.$transaction([
                prisma.articleLike.delete({
                    where: { id: existingLike.id }
                }),
                prisma.article.update({
                    where: { id: String(id) },
                    data: { likes: { decrement: 1 } }
                })
            ]);

            return res.json({ success: true, data: { liked: false } });
        }

        // Like
        await prisma.$transaction([
            prisma.articleLike.create({
                data: { articleId: String(id), userId }
            }),
            prisma.article.update({
                where: { id: String(id) },
                data: { likes: { increment: 1 } }
            }),
            // Create notification for author
            prisma.notification.create({
                data: {
                    userId: article.authorId,
                    type: 'like',
                    title: '收到新的点赞',
                    content: `${req.user!.name} 点赞了你的文章《${article.title}》`,
                    link: `/articles/${String(id)}`
                }
            })
        ]);

        res.json({ success: true, data: { liked: true } });
    } catch (error) {
        console.error('Like article error:', error);
        res.status(500).json({ success: false, message: '操作失败' });
    }
});

// POST /api/articles/:id/pin - 置顶文章 (Admin)
router.post('/:id/pin', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const article = await prisma.article.findUnique({ where: { id: String(id) } });
        if (!article) {
            return res.status(404).json({ success: false, message: '文章不存在' });
        }

        const updated = await prisma.article.update({
            where: { id: String(id) },
            data: { isTop: !article.isTop }
        });

        res.json({
            success: true,
            data: { isTop: updated.isTop },
            message: updated.isTop ? '文章已置顶' : '已取消置顶'
        });
    } catch (error) {
        console.error('Pin article error:', error);
        res.status(500).json({ success: false, message: '操作失败' });
    }
});

export default router;
