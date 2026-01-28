import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/:id - 获取用户详情
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id as string;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                employeeId: true,
                name: true,
                email: true,
                avatarUrl: true,
                department: true,
                role: true,
                points: true,
                createdAt: true,
                _count: {
                    select: {
                        articles: true,
                        comments: true,
                        articleLikes: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: '获取用户信息失败' });
    }
});

// PUT /api/users/:id - 更新用户信息
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const id = req.params.id as string;

        // Only allow updating own profile or admin
        if (req.user!.id !== id && req.user!.role !== 'admin' && req.user!.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: '无权修改该用户信息'
            });
        }

        const { name, avatarUrl, department } = req.body;

        const user = await prisma.user.update({
            where: { id },
            data: { name, avatarUrl, department },
            select: {
                id: true,
                employeeId: true,
                name: true,
                email: true,
                avatarUrl: true,
                department: true,
                role: true,
                points: true
            }
        });

        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: '更新用户信息失败' });
    }
});

// POST /api/users/checkin - 每日签到
router.post('/checkin', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already checked in today
        const existingCheckin = await prisma.pointTransaction.findFirst({
            where: {
                userId,
                relatedEntityType: 'checkin',
                createdAt: {
                    gte: today
                }
            }
        });

        if (existingCheckin) {
            return res.status(400).json({
                success: false,
                message: '今日已签到'
            });
        }

        // Create point transaction
        const reward = 10;

        await prisma.$transaction([
            prisma.pointTransaction.create({
                data: {
                    userId,
                    type: 'in',
                    amount: reward,
                    reason: '每日签到奖励',
                    relatedEntityType: 'checkin'
                }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { points: { increment: reward } }
            })
        ]);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { points: true }
        });

        res.json({
            success: true,
            data: {
                reward,
                currentPoints: user?.points
            },
            message: `签到成功，获得 ${reward} 积分`
        });
    } catch (error) {
        console.error('Checkin error:', error);
        res.status(500).json({ success: false, message: '签到失败' });
    }
});

// GET /api/users/:id/points - 获取积分记录
router.get('/:id/points', authenticate, async (req: AuthRequest, res) => {
    try {
        const id = req.params.id as string;
        const { page = 1, limit = 20 } = req.query;

        // Only allow viewing own points or admin
        if (req.user!.id !== id && req.user!.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '无权查看该用户积分'
            });
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [transactions, total] = await Promise.all([
            prisma.pointTransaction.findMany({
                where: { userId: id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.pointTransaction.count({ where: { userId: id } })
        ]);

        res.json({
            success: true,
            data: {
                transactions,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get points error:', error);
        res.status(500).json({ success: false, message: '获取积分记录失败' });
    }
});

// GET /api/leaderboard - 获取排行榜
router.get('/leaderboard/top', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const users = await prisma.user.findMany({
            orderBy: { points: 'desc' },
            take: Number(limit),
            select: {
                id: true,
                name: true,
                avatarUrl: true,
                points: true,
                department: true
            }
        });

        const leaderboard = users.map((user, index) => ({
            ...user,
            rank: index + 1,
            medal: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'none'
        }));

        res.json({ success: true, data: leaderboard });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ success: false, message: '获取排行榜失败' });
    }
});

export default router;
