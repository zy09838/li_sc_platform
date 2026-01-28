import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  // Simple health check - no dependencies
  if (!action) {
    return res.status(200).json({
      success: true,
      message: 'Li-SC Platform API is running',
      timestamp: new Date().toISOString(),
      env: { 
        hasDbUrl: !!process.env.DATABASE_URL, 
        hasDirectUrl: !!process.env.DIRECT_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV
      }
    });
  }

  // Database status check
  if (action === 'db-status') {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const userCount = await prisma.user.count();
      await prisma.$disconnect();
      return res.status(200).json({
        success: true,
        database: { status: 'connected', userCount }
      });
    } catch (error: any) {
      return res.status(200).json({
        success: false,
        database: { status: 'error', error: error.message }
      });
    }
  }

  // Seed database
  if (action === 'seed') {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const ADMIN_SECRET = process.env.ADMIN_SECRET || 'li-sc-seed-2026';
    const { secret } = req.body || {};
    
    if (secret !== ADMIN_SECRET) {
      return res.status(401).json({ success: false, message: '未授权' });
    }

    try {
      const { PrismaClient } = await import('@prisma/client');
      const bcrypt = await import('bcryptjs');
      const prisma = new PrismaClient();
      
      const hashedPassword = await bcrypt.hash('123456', 10);

      // Users
      const users = await Promise.all([
        prisma.user.upsert({
          where: { employeeId: 'SC001' },
          update: {},
          create: { employeeId: 'SC001', name: '朱岩滨', email: 'zhuyb@lixiang.com', password: hashedPassword, avatarUrl: 'https://picsum.photos/id/64/100/100', department: '供应链', role: 'admin', points: 1250 }
        }),
        prisma.user.upsert({
          where: { employeeId: 'SC002' },
          update: {},
          create: { employeeId: 'SC002', name: '黄予涵', email: 'huangyh@lixiang.com', password: hashedPassword, avatarUrl: 'https://picsum.photos/id/65/100/100', department: '产业研究', points: 980 }
        }),
        prisma.user.upsert({
          where: { employeeId: 'SC003' },
          update: {},
          create: { employeeId: 'SC003', name: '申奥', email: 'shenao@lixiang.com', password: hashedPassword, avatarUrl: 'https://picsum.photos/id/91/100/100', department: '公司精神', points: 850 }
        })
      ]);

      // Daily Tasks
      await Promise.all([
        prisma.dailyTask.upsert({ where: { id: 'task-checkin' }, update: {}, create: { id: 'task-checkin', title: '每日签到', reward: 10, type: 'checkin' } }),
        prisma.dailyTask.upsert({ where: { id: 'task-read' }, update: {}, create: { id: 'task-read', title: '阅读一篇专业发文', reward: 5, type: 'read' } }),
        prisma.dailyTask.upsert({ where: { id: 'task-download' }, update: {}, create: { id: 'task-download', title: '下载/预览知识库文档', reward: 5, type: 'download' } }),
        prisma.dailyTask.upsert({ where: { id: 'task-learn' }, update: {}, create: { id: 'task-learn', title: '完成一节课程学习', reward: 10, type: 'learn' } })
      ]);

      // Articles
      await Promise.all([
        prisma.article.upsert({
          where: { id: 'article-1' }, update: {},
          create: { id: 'article-1', title: '2025供应链数字化转型白皮书发布', summary: '深度解读供应链数字化的最新趋势与最佳实践', content: '随着数字经济的蓬勃发展，供应链数字化已成为企业降本增效的关键路径...', authorId: users[0].id, category: '行业资讯', tags: ['数字化', '白皮书'], imageUrl: 'https://picsum.photos/id/1/400/300', views: 1256, likes: 89, isTop: true, isOfficial: true, status: 'published', publishedAt: new Date() }
        }),
        prisma.article.upsert({
          where: { id: 'article-2' }, update: {},
          create: { id: 'article-2', title: '新能源汽车供应链最新发展报告', summary: '全面分析新能源汽车产业链的现状与未来发展方向', content: '新能源汽车行业的快速发展带动了整个供应链体系的变革...', authorId: users[1].id, category: '产业研究', tags: ['新能源', '汽车'], imageUrl: 'https://picsum.photos/id/111/400/300', views: 856, likes: 67, status: 'published', publishedAt: new Date() }
        })
      ]);

      // Activities
      const now = new Date();
      await Promise.all([
        prisma.activity.upsert({
          where: { id: 'activity-1' }, update: {},
          create: { id: 'activity-1', title: '2025年Q1供应链战略规划会', description: '讨论并确定2025年第一季度的供应链战略重点', imageUrl: 'https://picsum.photos/id/20/400/300', date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), location: '总部大楼3层会议室', status: 'upcoming', maxParticipants: 50, createdById: users[0].id }
        })
      ]);

      // Courses
      await Promise.all([
        prisma.course.upsert({ where: { id: 'course-1' }, update: {}, create: { id: 'course-1', title: '供应链管理基础', instructor: '张明教授', thumbnailUrl: 'https://picsum.photos/id/0/400/300', duration: '4小时', category: '供应链管理', description: '系统学习供应链管理的核心概念', videoCount: 12 } }),
        prisma.course.upsert({ where: { id: 'course-2' }, update: {}, create: { id: 'course-2', title: '采购谈判技巧', instructor: '李红主管', thumbnailUrl: 'https://picsum.photos/id/1/400/300', duration: '3小时', category: '采购管理', description: '掌握高效的采购谈判策略', videoCount: 8 } })
      ]);

      // Products
      await Promise.all([
        prisma.product.upsert({ where: { id: 'product-1' }, update: {}, create: { id: 'product-1', name: '理想定制保温杯', price: 200, imageUrl: 'https://picsum.photos/id/225/400/300', category: '生活用品', stock: 100, tags: ['新品', '限量'], isHot: true, isNew: true } }),
        prisma.product.upsert({ where: { id: 'product-2' }, update: {}, create: { id: 'product-2', name: '理想鼠标垫', price: 80, imageUrl: 'https://picsum.photos/id/96/400/300', category: '办公用品', stock: 200, tags: ['热销'], isHot: true } })
      ]);

      await prisma.$disconnect();

      return res.status(200).json({
        success: true,
        message: '数据库初始化完成',
        data: { users: users.length }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: '初始化失败: ' + (error.message || '未知错误') });
    }
  }

  return res.status(400).json({ success: false, message: 'Invalid action' });
}
