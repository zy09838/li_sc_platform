import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications - 获取通知列表
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = { userId: req.user!.id };
        if (unreadOnly === 'true') {
            where.isRead = false;
        }

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({ where: { userId: req.user!.id, isRead: false } })
        ]);

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
                pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: '获取通知失败' });
    }
});

// POST /api/notifications/:id/read - 标记已读
router.post('/:id/read', authenticate, async (req: AuthRequest, res) => {
    try {
        const id = req.params.id as string;

        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        res.json({ success: true, message: '已标记为已读' });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ success: false, message: '操作失败' });
    }
});

// POST /api/notifications/read-all - 全部标记已读
router.post('/read-all', authenticate, async (req: AuthRequest, res) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.user!.id, isRead: false },
            data: { isRead: true }
        });

        res.json({ success: true, message: '已全部标记为已读' });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ success: false, message: '操作失败' });
    }
});

// DELETE /api/notifications/:id - 删除通知
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const id = req.params.id as string;

        await prisma.notification.delete({ where: { id } });

        res.json({ success: true, message: '通知已删除' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ success: false, message: '删除失败' });
    }
});

export default router;
