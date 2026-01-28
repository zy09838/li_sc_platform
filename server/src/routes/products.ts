import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/products - 获取商品列表
router.get('/', async (req, res) => {
    try {
        const { category, page = 1, limit = 12 } = req.query;

        const where: any = { status: 'active' };
        if (category) where.category = category;

        const skip = (Number(page) - 1) * Number(limit);

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy: [{ isHot: 'desc' }, { isNew: 'desc' }, { createdAt: 'desc' }],
                skip,
                take: Number(limit)
            }),
            prisma.product.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                products,
                pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ success: false, message: '获取商品列表失败' });
    }
});

// GET /api/products/categories - 获取商品分类
router.get('/categories', async (req, res) => {
    try {
        const categories = await prisma.product.groupBy({
            by: ['category'],
            _count: { id: true },
            where: { status: 'active', category: { not: null } }
        });

        res.json({
            success: true,
            data: categories.map(c => ({ name: c.category, count: c._count.id }))
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, message: '获取分类失败' });
    }
});

// POST /api/orders - 创建兑换订单
router.post('/orders', authenticate, async (req: AuthRequest, res) => {
    try {
        const { productId } = req.body;

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ success: false, message: '商品不存在' });
        }

        if (product.stock <= 0) {
            return res.status(400).json({ success: false, message: '商品库存不足' });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
        if (!user || user.points < product.price) {
            return res.status(400).json({ success: false, message: '积分不足' });
        }

        // Create order in transaction
        const [order] = await prisma.$transaction([
            prisma.order.create({
                data: {
                    userId: req.user!.id,
                    productId,
                    pointsSpent: product.price,
                    status: 'confirmed'
                }
            }),
            prisma.user.update({
                where: { id: req.user!.id },
                data: { points: { decrement: product.price } }
            }),
            prisma.product.update({
                where: { id: productId },
                data: { stock: { decrement: 1 } }
            }),
            prisma.pointTransaction.create({
                data: {
                    userId: req.user!.id,
                    type: 'out',
                    amount: product.price,
                    reason: `兑换 ${product.name}`,
                    relatedEntityType: 'order',
                    relatedEntityId: productId
                }
            })
        ]);

        res.status(201).json({ success: true, data: order, message: '兑换成功' });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ success: false, message: '兑换失败' });
    }
});

// GET /api/orders - 获取用户订单
router.get('/orders', authenticate, async (req: AuthRequest, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: { userId: req.user!.id },
                include: { product: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.order.count({ where: { userId: req.user!.id } })
        ]);

        res.json({
            success: true,
            data: {
                orders,
                pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ success: false, message: '获取订单失败' });
    }
});

export default router;
