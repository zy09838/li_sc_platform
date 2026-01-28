import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/tasks - 获取每日任务列表
router.get('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tasks = await prisma.dailyTask.findMany({
            where: { isActive: true }
        });

        // Get today's completions
        const completions = await prisma.userTaskCompletion.findMany({
            where: {
                userId: req.user!.id,
                completedDate: today
            }
        });

        const completedTaskIds = new Set(completions.map(c => c.taskId));

        const tasksWithStatus = tasks.map(task => ({
            ...task,
            isCompleted: completedTaskIds.has(task.id)
        }));

        res.json({ success: true, data: tasksWithStatus });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ success: false, message: '获取任务列表失败' });
    }
});

// POST /api/tasks/:id/complete - 完成任务
router.post('/:id/complete', authenticate, async (req: AuthRequest, res) => {
    try {
        const id = req.params.id as string;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const task = await prisma.dailyTask.findUnique({ where: { id } });
        if (!task) {
            return res.status(404).json({ success: false, message: '任务不存在' });
        }

        // Check if already completed today
        const existing = await prisma.userTaskCompletion.findFirst({
            where: {
                userId: req.user!.id,
                taskId: id,
                completedDate: today
            }
        });

        if (existing) {
            return res.status(400).json({ success: false, message: '今日已完成该任务' });
        }

        // Complete task and award points
        await prisma.$transaction([
            prisma.userTaskCompletion.create({
                data: {
                    userId: req.user!.id,
                    taskId: id,
                    completedDate: today
                }
            }),
            prisma.pointTransaction.create({
                data: {
                    userId: req.user!.id,
                    type: 'in',
                    amount: task.reward,
                    reason: `完成任务：${task.title}`,
                    relatedEntityType: 'task',
                    relatedEntityId: id
                }
            }),
            prisma.user.update({
                where: { id: req.user!.id },
                data: { points: { increment: task.reward } }
            })
        ]);

        res.json({
            success: true,
            data: { reward: task.reward },
            message: `任务完成，获得 ${task.reward} 积分`
        });
    } catch (error) {
        console.error('Complete task error:', error);
        res.status(500).json({ success: false, message: '完成任务失败' });
    }
});

export default router;
