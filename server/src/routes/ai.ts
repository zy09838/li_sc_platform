import { Router } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ============ AI Tools ============

// GET /api/ai/tools - 获取 AI 工具列表
router.get('/tools', async (req, res) => {
    try {
        const { category } = req.query;

        const where: any = {};
        if (category) where.category = category;

        const tools = await prisma.aITool.findMany({
            where,
            orderBy: { clickCount: 'desc' }
        });

        res.json({ success: true, data: tools });
    } catch (error) {
        console.error('Get AI tools error:', error);
        res.status(500).json({ success: false, message: '获取 AI 工具列表失败' });
    }
});

// POST /api/ai/tools/:id/click - 记录工具点击
router.post('/tools/:id/click', async (req, res) => {
    try {
        const id = req.params.id as string;

        const tool = await prisma.aITool.update({
            where: { id },
            data: { clickCount: { increment: 1 } }
        });

        res.json({ success: true, data: { url: tool.url } });
    } catch (error) {
        console.error('Record click error:', error);
        res.status(500).json({ success: false, message: '操作失败' });
    }
});

// ============ AI Prompts ============

// GET /api/ai/prompts - 获取 Prompt 列表
router.get('/prompts', async (req, res) => {
    try {
        const { scenario, search, page = 1, limit = 20 } = req.query;

        const where: any = {};
        if (scenario) where.scenario = scenario;
        if (search) {
            where.OR = [
                { title: { contains: search as string, mode: 'insensitive' } },
                { content: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [prompts, total] = await Promise.all([
            prisma.aIPrompt.findMany({
                where,
                orderBy: { copyCount: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.aIPrompt.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                prompts,
                pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
            }
        });
    } catch (error) {
        console.error('Get prompts error:', error);
        res.status(500).json({ success: false, message: '获取 Prompt 列表失败' });
    }
});

// POST /api/ai/prompts/:id/copy - 记录复制
router.post('/prompts/:id/copy', async (req, res) => {
    try {
        const id = req.params.id as string;

        const prompt = await prisma.aIPrompt.update({
            where: { id },
            data: { copyCount: { increment: 1 } }
        });

        res.json({ success: true, data: { content: prompt.content } });
    } catch (error) {
        console.error('Record copy error:', error);
        res.status(500).json({ success: false, message: '操作失败' });
    }
});

// ============ AI News ============

// GET /api/ai/news - 获取 AI 资讯
router.get('/news', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [news, total] = await Promise.all([
            prisma.aINews.findMany({
                orderBy: { publishedAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.aINews.count()
        ]);

        res.json({
            success: true,
            data: {
                news,
                pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
            }
        });
    } catch (error) {
        console.error('Get AI news error:', error);
        res.status(500).json({ success: false, message: '获取 AI 资讯失败' });
    }
});

// ============ AI Assistant (规则引擎) ============

// POST /api/ai/assistant/chat - 智能问答 (规则引擎版)
router.post('/assistant/chat', authenticate, async (req: AuthRequest, res) => {
    try {
        const { message } = req.body;
        const query = message.toLowerCase();

        let responseContent: any = { type: 'text', text: '' };

        // 规则引擎：关键词匹配
        if (query.includes('文章') || query.includes('发文')) {
            const articles = await prisma.article.findMany({
                where: {
                    status: 'published',
                    OR: [
                        { title: { contains: message, mode: 'insensitive' } },
                        { summary: { contains: message, mode: 'insensitive' } }
                    ]
                },
                take: 3,
                include: { author: { select: { name: true } } }
            });

            if (articles.length > 0) {
                responseContent = {
                    type: 'articles',
                    text: `为您找到 ${articles.length} 篇相关文章：`,
                    items: articles.map(a => ({ id: a.id, title: a.title, author: a.author.name }))
                };
            } else {
                responseContent.text = '暂未找到相关文章，您可以尝试其他关键词。';
            }
        } else if (query.includes('课程') || query.includes('学习')) {
            const courses = await prisma.course.findMany({
                where: {
                    status: 'active',
                    title: { contains: message, mode: 'insensitive' }
                },
                take: 3
            });

            if (courses.length > 0) {
                responseContent = {
                    type: 'courses',
                    text: `为您推荐 ${courses.length} 门相关课程：`,
                    items: courses.map(c => ({ id: c.id, title: c.title, instructor: c.instructor }))
                };
            } else {
                responseContent.text = '暂未找到相关课程，建议浏览培训中心查看全部课程。';
            }
        } else if (query.includes('积分') || query.includes('签到')) {
            const user = await prisma.user.findUnique({
                where: { id: req.user!.id },
                select: { points: true }
            });
            responseContent.text = `您当前有 ${user?.points || 0} 积分。每日签到可获得 10 积分，完成课程可获得 50 积分哦！`;
        } else if (query.includes('活动')) {
            const activities = await prisma.activity.findMany({
                where: { status: 'upcoming' },
                take: 3,
                orderBy: { date: 'asc' }
            });

            if (activities.length > 0) {
                responseContent = {
                    type: 'activities',
                    text: `近期有 ${activities.length} 个活动：`,
                    items: activities.map(a => ({ id: a.id, title: a.title, date: a.date }))
                };
            } else {
                responseContent.text = '暂无近期活动，请关注活动中心获取最新动态。';
            }
        } else {
            responseContent.text = '我是 Li-SC 智能助手，可以帮您搜索文章、课程、活动，查询积分等。请问有什么可以帮您？';
        }

        res.json({ success: true, data: responseContent });
    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ success: false, message: '处理请求失败' });
    }
});

// GET /api/ai/search - 全站搜索
router.get('/search', async (req, res) => {
    try {
        const { q, type } = req.query;

        if (!q) {
            return res.status(400).json({ success: false, message: '请提供搜索关键词' });
        }

        const query = q as string;
        const results: any = {};

        if (!type || type === 'articles') {
            results.articles = await prisma.article.findMany({
                where: {
                    status: 'published',
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { summary: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                select: { id: true, title: true, summary: true, category: true }
            });
        }

        if (!type || type === 'courses') {
            results.courses = await prisma.course.findMany({
                where: {
                    status: 'active',
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                select: { id: true, title: true, instructor: true, category: true }
            });
        }

        if (!type || type === 'docs') {
            results.docs = await prisma.knowledgeDoc.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                select: { id: true, title: true, fileType: true, category: true }
            });
        }

        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ success: false, message: '搜索失败' });
    }
});

export default router;
