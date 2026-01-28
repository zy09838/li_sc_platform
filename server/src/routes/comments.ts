import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/comments - 获取文章评论
router.get('/', async (req, res) => {
    try {
        const { articleId, page = 1, limit = 20 } = req.query;

        if (!articleId) {
            return res.status(400).json({
                success: false,
                message: '请提供文章ID'
            });
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                where: {
                    articleId: articleId as string,
                    parentId: null // Only top-level comments
                },
                include: {
                    author: {
                        select: { id: true, name: true, avatarUrl: true }
                    },
                    replies: {
                        include: {
                            author: {
                                select: { id: true, name: true, avatarUrl: true }
                            }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.comment.count({
                where: { articleId: articleId as string, parentId: null }
            })
        ]);

        res.json({
            success: true,
            data: {
                comments,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ success: false, message: '获取评论失败' });
    }
});

// POST /api/comments - 创建评论
router.post('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { articleId, content, parentId } = req.body;

        if (!articleId || !content) {
            return res.status(400).json({
                success: false,
                message: '请提供文章ID和评论内容'
            });
        }

        const article = await prisma.article.findUnique({ where: { id: articleId } });
        if (!article) {
            return res.status(404).json({ success: false, message: '文章不存在' });
        }

        // Create comment and update count in transaction
        const [comment] = await prisma.$transaction([
            prisma.comment.create({
                data: {
                    content,
                    articleId,
                    authorId: req.user!.id,
                    parentId
                },
                include: {
                    author: {
                        select: { id: true, name: true, avatarUrl: true }
                    }
                }
            }),
            prisma.article.update({
                where: { id: articleId },
                data: { commentsCount: { increment: 1 } }
            }),
            // Notify article author
            prisma.notification.create({
                data: {
                    userId: article.authorId,
                    type: 'comment',
                    title: '收到新评论',
                    content: `${req.user!.name} 评论了你的文章《${article.title}》: "${content.substring(0, 50)}..."`,
                    link: `/articles/${articleId}`
                }
            })
        ]);

        // Award points for first comment of the day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayComment = await prisma.comment.findFirst({
            where: {
                authorId: req.user!.id,
                createdAt: { gte: today },
                id: { not: comment.id }
            }
        });

        if (!todayComment) {
            await prisma.$transaction([
                prisma.pointTransaction.create({
                    data: {
                        userId: req.user!.id,
                        type: 'in',
                        amount: 5,
                        reason: '每日首次评论奖励',
                        relatedEntityType: 'comment',
                        relatedEntityId: comment.id
                    }
                }),
                prisma.user.update({
                    where: { id: req.user!.id },
                    data: { points: { increment: 5 } }
                })
            ]);
        }

        res.status(201).json({ success: true, data: comment });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ success: false, message: '评论失败' });
    }
});

// DELETE /api/comments/:id - 删除评论
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const id = req.params.id as string;

        const comment = await prisma.comment.findUnique({ where: { id } });

        if (!comment) {
            return res.status(404).json({ success: false, message: '评论不存在' });
        }

        if (comment.authorId !== req.user!.id && req.user!.role !== 'admin') {
            return res.status(403).json({ success: false, message: '无权删除该评论' });
        }

        await prisma.$transaction([
            prisma.comment.delete({ where: { id } }),
            prisma.article.update({
                where: { id: comment.articleId },
                data: { commentsCount: { decrement: 1 } }
            })
        ]);

        res.json({ success: true, message: '评论已删除' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ success: false, message: '删除评论失败' });
    }
});

export default router;
