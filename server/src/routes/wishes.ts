import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ============ Wishes (心愿墙) ============

// GET /api/wishes - 获取心愿列表
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [wishes, total] = await Promise.all([
            prisma.wish.findMany({
                include: {
                    author: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.wish.count()
        ]);

        // Mask author name if anonymous
        const maskedWishes = wishes.map(w => ({
            ...w,
            author: w.isAnonymous ? { id: w.author.id, name: '匿名' } : w.author
        }));

        res.json({
            success: true,
            data: {
                wishes: maskedWishes,
                pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
            }
        });
    } catch (error) {
        console.error('Get wishes error:', error);
        res.status(500).json({ success: false, message: '获取心愿列表失败' });
    }
});

// POST /api/wishes - 发布心愿
router.post('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { content, isAnonymous = true, color } = req.body;

        const colors = ['bg-yellow-100', 'bg-pink-100', 'bg-blue-100', 'bg-green-100'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const wish = await prisma.wish.create({
            data: {
                content,
                authorId: req.user!.id,
                isAnonymous,
                color: color || randomColor
            }
        });

        res.status(201).json({ success: true, data: wish });
    } catch (error) {
        console.error('Create wish error:', error);
        res.status(500).json({ success: false, message: '发布心愿失败' });
    }
});

// POST /api/wishes/:id/like - 点赞心愿
router.post('/:id/like', authenticate, async (req: AuthRequest, res) => {
    try {
        const id = req.params.id as string;

        const existing = await prisma.wishLike.findUnique({
            where: { wishId_userId: { wishId: id, userId: req.user!.id } }
        });

        if (existing) {
            await prisma.$transaction([
                prisma.wishLike.delete({ where: { id: existing.id } }),
                prisma.wish.update({ where: { id }, data: { likes: { decrement: 1 } } })
            ]);
            return res.json({ success: true, data: { liked: false } });
        }

        await prisma.$transaction([
            prisma.wishLike.create({ data: { wishId: id, userId: req.user!.id } }),
            prisma.wish.update({ where: { id }, data: { likes: { increment: 1 } } })
        ]);

        res.json({ success: true, data: { liked: true } });
    } catch (error) {
        console.error('Like wish error:', error);
        res.status(500).json({ success: false, message: '操作失败' });
    }
});

// ============ Food Recommendations (美食推荐) ============

// GET /api/wishes/food - 获取美食推荐
router.get('/food', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [foods, total] = await Promise.all([
            prisma.foodRecommendation.findMany({
                include: {
                    recommender: { select: { id: true, name: true, avatarUrl: true } }
                },
                orderBy: { rating: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.foodRecommendation.count()
        ]);

        res.json({
            success: true,
            data: {
                foods,
                pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
            }
        });
    } catch (error) {
        console.error('Get foods error:', error);
        res.status(500).json({ success: false, message: '获取美食列表失败' });
    }
});

// POST /api/wishes/food - 添加美食推荐
router.post('/food', authenticate, async (req: AuthRequest, res) => {
    try {
        const { name, rating, imageUrl, tags } = req.body;

        const food = await prisma.foodRecommendation.create({
            data: {
                name,
                rating,
                imageUrl,
                tags: tags || [],
                recommenderId: req.user!.id
            }
        });

        res.status(201).json({ success: true, data: food });
    } catch (error) {
        console.error('Create food error:', error);
        res.status(500).json({ success: false, message: '添加美食推荐失败' });
    }
});

export default router;
