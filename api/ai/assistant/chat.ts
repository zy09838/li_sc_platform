import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { setCorsHeaders } from '../../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

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
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { points: true }
      });
      responseContent.text = `您当前有 ${userData?.points || 0} 积分。每日签到可获得 10 积分，完成课程可获得 50 积分哦！`;
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

    return res.status(200).json({ success: true, data: responseContent });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({ success: false, message: '处理请求失败' });
  }
}
