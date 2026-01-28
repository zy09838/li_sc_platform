import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/activities - 获取活动列表
router.get('/', async (req, res) => {
    try {
        const { status, month, year, page = 1, limit = 10 } = req.query;

        const where: any = {};

        if (status) {
            where.status = String(status);
        }

        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0);
            where.date = {
                gte: startDate,
                lte: endDate
            };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [activities, total] = await Promise.all([
            prisma.activity.findMany({
                where,
                include: {
                    _count: { select: { registrations: true } },
                    votes: true
                },
                orderBy: { date: 'asc' },
                skip,
                take: Number(limit)
            }),
            prisma.activity.count({ where })
        ]);

        // Format activities with participant count
        const formattedActivities = activities.map((a: any) => ({
            ...a,
            participants: a._count.registrations,
            hasVoting: a.votes.length > 0
        }));

        res.json({
            success: true,
            data: {
                activities: formattedActivities,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ success: false, message: '获取活动列表失败' });
    }
});

// GET /api/activities/calendar - 获取日历视图活动
router.get('/calendar', async (req, res) => {
    try {
        const { month, year } = req.query;

        const currentYear = year ? Number(year) : new Date().getFullYear();
        const currentMonth = month ? Number(month) - 1 : new Date().getMonth();

        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0);

        const activities = await prisma.activity.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                id: true,
                title: true,
                date: true,
                status: true
            }
        });

        // Group by date
        const calendarData: Record<string, any[]> = {};
        activities.forEach((a: any) => {
            const dateKey = a.date.toISOString().split('T')[0];
            if (!calendarData[dateKey]) {
                calendarData[dateKey] = [];
            }
            calendarData[dateKey].push(a);
        });

        res.json({ success: true, data: calendarData });
    } catch (error) {
        console.error('Get calendar error:', error);
        res.status(500).json({ success: false, message: '获取日历数据失败' });
    }
});

// GET /api/activities/:id - 获取活动详情
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const activity: any = await prisma.activity.findUnique({
            where: { id: String(id) },
            include: {
                createdBy: {
                    select: { id: true, name: true, avatarUrl: true }
                },
                _count: { select: { registrations: true } },
                votes: true
            }
        });

        if (!activity) {
            return res.status(404).json({ success: false, message: '活动不存在' });
        }

        // Check if user registered
        const registration = await prisma.activityRegistration.findUnique({
            where: {
                activityId_userId: { activityId: String(id), userId: req.user!.id }
            }
        });

        // Check if user voted
        let userVotedOptionId = null;
        if (activity.votes && activity.votes.length > 0) {
            const userVote = await prisma.userVote.findFirst({
                where: {
                    voteId: activity.votes[0].id,
                    userId: req.user!.id
                }
            });
            userVotedOptionId = userVote?.optionId;
        }

        res.json({
            success: true,
            data: {
                ...activity,
                participants: activity._count.registrations,
                isRegistered: !!registration,
                userVotedOptionId
            }
        });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ success: false, message: '获取活动详情失败' });
    }
});

// POST /api/activities - 创建活动 (Admin)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const {
            title, description, imageUrl, date, location,
            maxParticipants, isQuarterly, hasVoting, voteTitle, voteOptions
        } = req.body;

        const activity = await prisma.activity.create({
            data: {
                title: String(title),
                description: description ? String(description) : null,
                imageUrl: imageUrl ? String(imageUrl) : null,
                date: new Date(date),
                location: location ? String(location) : null,
                maxParticipants: maxParticipants ? Number(maxParticipants) : null,
                isQuarterly: Boolean(isQuarterly),
                hasVoting: Boolean(hasVoting),
                createdById: req.user!.id
            }
        });

        // Create vote if needed
        if (hasVoting && voteOptions) {
            await prisma.activityVote.create({
                data: {
                    activityId: activity.id,
                    title: voteTitle ? String(voteTitle) : null,
                    options: voteOptions
                }
            });
        }

        res.status(201).json({ success: true, data: activity });
    } catch (error) {
        console.error('Create activity error:', error);
        res.status(500).json({ success: false, message: '创建活动失败' });
    }
});

// PUT /api/activities/:id - 更新活动 (Admin)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { title, description, imageUrl, date, location, status, maxParticipants } = req.body;

        const activity = await prisma.activity.update({
            where: { id: String(id) },
            data: {
                title: title ? String(title) : undefined,
                description: description !== undefined ? String(description) : undefined,
                imageUrl: imageUrl !== undefined ? String(imageUrl) : undefined,
                date: date ? new Date(date) : undefined,
                location: location !== undefined ? String(location) : undefined,
                status: status ? String(status) : undefined,
                maxParticipants: maxParticipants !== undefined ? Number(maxParticipants) : undefined
            }
        });

        res.json({ success: true, data: activity });
    } catch (error) {
        console.error('Update activity error:', error);
        res.status(500).json({ success: false, message: '更新活动失败' });
    }
});

// DELETE /api/activities/:id - 删除活动 (Admin)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        await prisma.activity.delete({ where: { id: String(id) } });

        res.json({ success: true, message: '活动已删除' });
    } catch (error) {
        console.error('Delete activity error:', error);
        res.status(500).json({ success: false, message: '删除活动失败' });
    }
});

// POST /api/activities/:id/register - 报名活动
router.post('/:id/register', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const activity: any = await prisma.activity.findUnique({
            where: { id: String(id) },
            include: { _count: { select: { registrations: true } } }
        });

        if (!activity) {
            return res.status(404).json({ success: false, message: '活动不存在' });
        }

        if (activity.status === 'ended') {
            return res.status(400).json({ success: false, message: '活动已结束' });
        }

        if (activity.maxParticipants && activity._count.registrations >= activity.maxParticipants) {
            return res.status(400).json({ success: false, message: '报名人数已满' });
        }

        // Check if already registered
        const existing = await prisma.activityRegistration.findUnique({
            where: { activityId_userId: { activityId: String(id), userId: req.user!.id } }
        });

        if (existing) {
            // Cancel registration
            await prisma.activityRegistration.delete({ where: { id: existing.id } });
            return res.json({ success: true, data: { registered: false }, message: '已取消报名' });
        }

        // Register
        await prisma.activityRegistration.create({
            data: { activityId: String(id), userId: req.user!.id }
        });

        res.json({ success: true, data: { registered: true }, message: '报名成功' });
    } catch (error) {
        console.error('Register activity error:', error);
        res.status(500).json({ success: false, message: '报名失败' });
    }
});

// POST /api/activities/:id/vote - 投票
router.post('/:id/vote', authenticate, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { optionId } = req.body;

        const activity: any = await prisma.activity.findUnique({
            where: { id: String(id) },
            include: { votes: true }
        });

        if (!activity || !activity.votes || activity.votes.length === 0) {
            return res.status(404).json({ success: false, message: '投票不存在' });
        }

        const vote = activity.votes[0];

        // Check if already voted
        const existing = await prisma.userVote.findUnique({
            where: { voteId_userId: { voteId: vote.id, userId: req.user!.id } }
        });

        if (existing) {
            return res.status(400).json({ success: false, message: '您已投过票' });
        }

        // Create vote
        await prisma.userVote.create({
            data: { voteId: vote.id, userId: req.user!.id, optionId: String(optionId) }
        });

        // Update vote count in options
        const options = vote.options as any[];
        const updatedOptions = options.map((opt: any) => {
            if (opt.id === optionId) {
                return { ...opt, count: (opt.count || 0) + 1 };
            }
            return opt;
        });

        await prisma.activityVote.update({
            where: { id: vote.id },
            data: { options: updatedOptions }
        });

        res.json({ success: true, message: '投票成功' });
    } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({ success: false, message: '投票失败' });
    }
});

export default router;
