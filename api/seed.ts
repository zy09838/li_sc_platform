import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { prisma } from './_lib/prisma';
import { setCorsHeaders } from './_lib/cors';

// 简单的管理员密钥验证（生产环境应使用更安全的方式）
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'li-sc-seed-2026';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // 验证管理员密钥
  const { secret } = req.body;
  if (secret !== ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  try {
    console.log('🌱 Seeding database...');

    // ============ Users ============
    const hashedPassword = await bcrypt.hash('123456', 10);

    const users = await Promise.all([
      prisma.user.upsert({
        where: { employeeId: 'SC001' },
        update: {},
        create: {
          employeeId: 'SC001',
          name: '朱岩滨',
          email: 'zhuyb@lixiang.com',
          password: hashedPassword,
          avatarUrl: 'https://picsum.photos/id/64/100/100',
          department: '供应链',
          role: 'admin',
          points: 1250
        }
      }),
      prisma.user.upsert({
        where: { employeeId: 'SC002' },
        update: {},
        create: {
          employeeId: 'SC002',
          name: '黄予涵',
          email: 'huangyh@lixiang.com',
          password: hashedPassword,
          avatarUrl: 'https://picsum.photos/id/65/100/100',
          department: '产业研究',
          points: 980
        }
      }),
      prisma.user.upsert({
        where: { employeeId: 'SC003' },
        update: {},
        create: {
          employeeId: 'SC003',
          name: '申奥',
          email: 'shenao@lixiang.com',
          password: hashedPassword,
          avatarUrl: 'https://picsum.photos/id/91/100/100',
          department: '公司精神',
          points: 850
        }
      })
    ]);

    console.log(`✅ Created ${users.length} users`);

    // ============ Daily Tasks ============
    const tasks = await Promise.all([
      prisma.dailyTask.upsert({
        where: { id: 'task-checkin' },
        update: {},
        create: { id: 'task-checkin', title: '每日签到', reward: 10, type: 'checkin' }
      }),
      prisma.dailyTask.upsert({
        where: { id: 'task-read' },
        update: {},
        create: { id: 'task-read', title: '阅读一篇专业发文', reward: 5, type: 'read' }
      }),
      prisma.dailyTask.upsert({
        where: { id: 'task-download' },
        update: {},
        create: { id: 'task-download', title: '下载/预览知识库文档', reward: 5, type: 'download' }
      }),
      prisma.dailyTask.upsert({
        where: { id: 'task-learn' },
        update: {},
        create: { id: 'task-learn', title: '完成一节课程学习', reward: 10, type: 'learn' }
      })
    ]);

    console.log(`✅ Created ${tasks.length} daily tasks`);

    // ============ Articles ============
    const articles = await Promise.all([
      prisma.article.upsert({
        where: { id: 'article-1' },
        update: {},
        create: {
          id: 'article-1',
          title: '2025供应链数字化转型白皮书发布',
          summary: '深度解读供应链数字化的最新趋势与最佳实践，助力企业提升供应链效率。',
          content: '随着数字经济的蓬勃发展，供应链数字化已成为企业降本增效的关键路径...',
          authorId: users[0].id,
          category: '行业资讯',
          tags: ['数字化', '白皮书', '趋势'],
          imageUrl: 'https://picsum.photos/id/1/400/300',
          views: 1256,
          likes: 89,
          isTop: true,
          isOfficial: true,
          status: 'published',
          publishedAt: new Date()
        }
      }),
      prisma.article.upsert({
        where: { id: 'article-2' },
        update: {},
        create: {
          id: 'article-2',
          title: '新能源汽车供应链最新发展报告',
          summary: '全面分析新能源汽车产业链的现状与未来发展方向。',
          content: '新能源汽车行业的快速发展带动了整个供应链体系的变革...',
          authorId: users[1].id,
          category: '产业研究',
          tags: ['新能源', '汽车', '供应链'],
          imageUrl: 'https://picsum.photos/id/111/400/300',
          views: 856,
          likes: 67,
          status: 'published',
          publishedAt: new Date()
        }
      }),
      prisma.article.upsert({
        where: { id: 'article-3' },
        update: {},
        create: {
          id: 'article-3',
          title: '供应商管理最佳实践分享',
          summary: '来自一线的供应商管理经验总结，助您优化供应商关系。',
          content: '在供应商管理实践中，建立科学的评估体系至关重要...',
          authorId: users[2].id,
          category: '经验分享',
          tags: ['供应商', '管理', '最佳实践'],
          imageUrl: 'https://picsum.photos/id/180/400/300',
          views: 623,
          likes: 45,
          status: 'published',
          publishedAt: new Date()
        }
      })
    ]);

    console.log(`✅ Created ${articles.length} articles`);

    // ============ Activities ============
    const now = new Date();
    const activities = await Promise.all([
      prisma.activity.upsert({
        where: { id: 'activity-1' },
        update: {},
        create: {
          id: 'activity-1',
          title: '2025年Q1供应链战略规划会',
          description: '讨论并确定2025年第一季度的供应链战略重点',
          imageUrl: 'https://picsum.photos/id/20/400/300',
          date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          location: '总部大楼3层会议室',
          status: 'upcoming',
          maxParticipants: 50,
          createdById: users[0].id
        }
      }),
      prisma.activity.upsert({
        where: { id: 'activity-2' },
        update: {},
        create: {
          id: 'activity-2',
          title: '供应链数字化培训工作坊',
          description: '数字化工具实操培训，提升团队数字化能力',
          imageUrl: 'https://picsum.photos/id/48/400/300',
          date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          location: '培训中心',
          status: 'upcoming',
          maxParticipants: 30,
          createdById: users[0].id
        }
      })
    ]);

    console.log(`✅ Created ${activities.length} activities`);

    // ============ Courses ============
    const courses = await Promise.all([
      prisma.course.upsert({
        where: { id: 'course-1' },
        update: {},
        create: {
          id: 'course-1',
          title: '供应链管理基础',
          instructor: '张明教授',
          thumbnailUrl: 'https://picsum.photos/id/0/400/300',
          duration: '4小时',
          category: '供应链管理',
          description: '系统学习供应链管理的核心概念和方法论',
          videoCount: 12
        }
      }),
      prisma.course.upsert({
        where: { id: 'course-2' },
        update: {},
        create: {
          id: 'course-2',
          title: '采购谈判技巧',
          instructor: '李红主管',
          thumbnailUrl: 'https://picsum.photos/id/1/400/300',
          duration: '3小时',
          category: '采购管理',
          description: '掌握高效的采购谈判策略与技巧',
          videoCount: 8
        }
      }),
      prisma.course.upsert({
        where: { id: 'course-3' },
        update: {},
        create: {
          id: 'course-3',
          title: '库存优化实战',
          instructor: '王强经理',
          thumbnailUrl: 'https://picsum.photos/id/2/400/300',
          duration: '5小时',
          category: '库存管理',
          description: '学习先进的库存管理方法，降低库存成本',
          videoCount: 15
        }
      })
    ]);

    console.log(`✅ Created ${courses.length} courses`);

    // ============ Products ============
    const products = await Promise.all([
      prisma.product.upsert({
        where: { id: 'product-1' },
        update: {},
        create: {
          id: 'product-1',
          name: '理想定制保温杯',
          price: 200,
          imageUrl: 'https://picsum.photos/id/225/400/300',
          category: '生活用品',
          stock: 100,
          tags: ['新品', '限量'],
          isHot: true,
          isNew: true
        }
      }),
      prisma.product.upsert({
        where: { id: 'product-2' },
        update: {},
        create: {
          id: 'product-2',
          name: '理想鼠标垫',
          price: 80,
          imageUrl: 'https://picsum.photos/id/96/400/300',
          category: '办公用品',
          stock: 200,
          tags: ['热销'],
          isHot: true
        }
      }),
      prisma.product.upsert({
        where: { id: 'product-3' },
        update: {},
        create: {
          id: 'product-3',
          name: '理想帆布袋',
          price: 50,
          imageUrl: 'https://picsum.photos/id/292/400/300',
          category: '生活用品',
          stock: 150,
          tags: ['环保']
        }
      }),
      prisma.product.upsert({
        where: { id: 'product-4' },
        update: {},
        create: {
          id: 'product-4',
          name: '咖啡兑换券',
          price: 30,
          imageUrl: 'https://picsum.photos/id/312/400/300',
          category: '餐饮券',
          stock: 500,
          isHot: true
        }
      })
    ]);

    console.log(`✅ Created ${products.length} products`);

    // ============ Knowledge Docs ============
    const docs = await Promise.all([
      prisma.knowledgeDoc.upsert({
        where: { id: 'doc-1' },
        update: {},
        create: {
          id: 'doc-1',
          title: '供应商评估标准手册',
          fileType: 'pdf',
          fileUrl: '/docs/supplier-evaluation.pdf',
          fileSize: '2.5MB',
          description: '详细的供应商评估流程和标准',
          category: '标准规范',
          uploaderId: users[0].id,
          downloads: 156,
          tags: ['供应商', '评估', '标准']
        }
      }),
      prisma.knowledgeDoc.upsert({
        where: { id: 'doc-2' },
        update: {},
        create: {
          id: 'doc-2',
          title: '采购流程SOP',
          fileType: 'pdf',
          fileUrl: '/docs/procurement-sop.pdf',
          fileSize: '1.8MB',
          description: '标准采购操作流程',
          category: 'SOP',
          uploaderId: users[0].id,
          downloads: 234,
          tags: ['采购', 'SOP']
        }
      })
    ]);

    console.log(`✅ Created ${docs.length} knowledge docs`);

    console.log('✅ Seeding completed!');

    return res.status(200).json({ 
      success: true, 
      message: '数据库初始化完成',
      data: {
        users: users.length,
        tasks: tasks.length,
        articles: articles.length,
        activities: activities.length,
        courses: courses.length,
        products: products.length,
        docs: docs.length
      }
    });
  } catch (error: any) {
    console.error('❌ Seeding failed:', error);
    return res.status(500).json({ 
      success: false, 
      message: '初始化失败: ' + (error.message || '未知错误')
    });
  }
}
