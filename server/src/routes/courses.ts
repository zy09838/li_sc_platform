import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/courses - 获取课程列表
router.get('/', async (req, res) => {
    try {
        const { category, page = 1, limit = 10 } = req.query;

        const where: any = { status: 'active' };
        if (category) {
            where.category = category;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.course.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                courses,
                pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
            }
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ success: false, message: '获取课程列表失败' });
    }
});

// GET /api/courses/my - 获取我的学习进度
router.get('/my', authenticate, async (req: AuthRequest, res) => {
    try {
        const progress = await prisma.userCourseProgress.findMany({
            where: { userId: req.user!.id },
            include: { course: true },
            orderBy: { lastStudiedAt: 'desc' }
        });

        res.json({ success: true, data: progress });
    } catch (error) {
        console.error('Get my courses error:', error);
        res.status(500).json({ success: false, message: '获取学习进度失败' });
    }
});

// POST /api/courses/:id/progress - 更新学习进度
router.post('/:id/progress', authenticate, async (req: AuthRequest, res) => {
    try {
        const id = req.params.id as string;
        const { progress } = req.body;

        const course = await prisma.course.findUnique({ where: { id } });
        if (!course) {
            return res.status(404).json({ success: false, message: '课程不存在' });
        }

        const existing = await prisma.userCourseProgress.findUnique({
            where: { userId_courseId: { userId: req.user!.id, courseId: id } }
        });

        const isNewCompletion = progress >= 100 && (!existing || existing.progress < 100);

        const updated = await prisma.userCourseProgress.upsert({
            where: { userId_courseId: { userId: req.user!.id, courseId: id } },
            create: {
                userId: req.user!.id,
                courseId: id,
                progress,
                lastStudiedAt: new Date(),
                completedAt: progress >= 100 ? new Date() : null
            },
            update: {
                progress,
                lastStudiedAt: new Date(),
                completedAt: progress >= 100 ? new Date() : undefined
            }
        });

        // Award points for completion
        if (isNewCompletion) {
            await prisma.$transaction([
                prisma.pointTransaction.create({
                    data: {
                        userId: req.user!.id,
                        type: 'in',
                        amount: 50,
                        reason: `完成课程《${course.title}》`,
                        relatedEntityType: 'course',
                        relatedEntityId: id
                    }
                }),
                prisma.user.update({
                    where: { id: req.user!.id },
                    data: { points: { increment: 50 } }
                })
            ]);
        }

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ success: false, message: '更新进度失败' });
    }
});

// GET /api/courses/learning-paths - 获取学习路径
router.get('/learning-paths', async (req, res) => {
    try {
        const paths = await prisma.learningPath.findMany();
        res.json({ success: true, data: paths });
    } catch (error) {
        console.error('Get learning paths error:', error);
        res.status(500).json({ success: false, message: '获取学习路径失败' });
    }
});

// GET /api/courses/knowledge-docs - 获取知识库文档
router.get('/knowledge-docs', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 20 } = req.query;

        const where: any = {};
        if (category) where.category = category;
        if (search) {
            where.OR = [
                { title: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [docs, total] = await Promise.all([
            prisma.knowledgeDoc.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.knowledgeDoc.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                docs,
                pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
            }
        });
    } catch (error) {
        console.error('Get docs error:', error);
        res.status(500).json({ success: false, message: '获取文档列表失败' });
    }
});

// POST /api/courses/knowledge-docs/:id/download - 记录下载
router.post('/knowledge-docs/:id/download', authenticate, async (req: AuthRequest, res) => {
    try {
        const id = req.params.id as string;

        const doc = await prisma.knowledgeDoc.update({
            where: { id },
            data: { downloads: { increment: 1 } }
        });

        res.json({ success: true, data: { downloadUrl: doc.fileUrl } });
    } catch (error) {
        console.error('Download doc error:', error);
        res.status(500).json({ success: false, message: '下载失败' });
    }
});

export default router;
