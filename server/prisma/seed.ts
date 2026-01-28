import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
        }
    }
} as any);

async function main() {
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
            create: { id: 'task-learn', title: '完成一节在线课程', reward: 50, type: 'learn' }
        })
    ]);

    console.log(`✅ Created ${tasks.length} daily tasks`);

    // ============ Courses ============
    const courses = await Promise.all([
        prisma.course.create({
            data: {
                title: '供应链战略基础',
                instructor: '李教授',
                thumbnailUrl: 'https://picsum.photos/id/20/400/250',
                duration: '4h 30m',
                category: '专业课程'
            }
        }),
        prisma.course.create({
            data: {
                title: '2025采购谈判技巧',
                instructor: '王总监',
                thumbnailUrl: 'https://picsum.photos/id/24/400/250',
                duration: '2h 15m',
                category: '实战赋能'
            }
        }),
        prisma.course.create({
            data: {
                title: '库存管理与优化',
                instructor: '张专家',
                thumbnailUrl: 'https://picsum.photos/id/60/400/250',
                duration: '6h 00m',
                category: '专业课程'
            }
        })
    ]);

    console.log(`✅ Created ${courses.length} courses`);

    // ============ Learning Paths ============
    await Promise.all([
        prisma.learningPath.create({
            data: {
                title: '采购新兵训练营',
                description: '从零开始，掌握理想汽车采购流程与供应商管理基础。',
                icon: '🎯',
                stepsCount: 5,
                level: 'Beginner'
            }
        }),
        prisma.learningPath.create({
            data: {
                title: '供应链计划专家',
                description: '深钻需求预测、库存优化与风险管理，提升全局规划力。',
                icon: '📊',
                stepsCount: 8,
                level: 'Advanced'
            }
        })
    ]);

    // ============ Products ============
    const products = await Promise.all([
        prisma.product.create({
            data: {
                name: 'Li Auto 理想汽车 定制卫衣',
                price: 3500,
                imageUrl: 'https://picsum.photos/id/445/400/400',
                category: '品牌服饰',
                stock: 50,
                tags: ['热销', '秋冬限定'],
                isHot: true
            }
        }),
        prisma.product.create({
            data: {
                name: 'L9 1:18 合金车模 (黑武士版)',
                price: 12000,
                imageUrl: 'https://picsum.photos/id/111/400/400',
                category: '精品车模',
                stock: 5,
                tags: ['收藏级', '限量'],
                isHot: true
            }
        }),
        prisma.product.create({
            data: {
                name: '理链·探索 商务笔记本套装',
                price: 800,
                imageUrl: 'https://picsum.photos/id/24/400/400',
                category: '办公文创',
                stock: 120,
                tags: ['办公必备'],
                isNew: true
            }
        }),
        prisma.product.create({
            data: {
                name: 'Li-SC 陶瓷马克杯 (哑光黑)',
                price: 500,
                imageUrl: 'https://picsum.photos/id/30/400/400',
                category: '生活周边',
                stock: 200,
                tags: ['日常']
            }
        })
    ]);

    console.log(`✅ Created ${products.length} products`);

    // ============ AI Tools ============
    await Promise.all([
        prisma.aITool.create({
            data: {
                name: 'Mind GPT (Supply Chain)',
                description: '理想汽车自研大模型，专精于供应链知识问答与数据查询。',
                icon: 'Bot',
                category: 'Data',
                url: '#',
                isInternal: true
            }
        }),
        prisma.aITool.create({
            data: {
                name: 'ChatGPT-4o',
                description: '通用的强大助手，适合邮件润色、翻译与创意发散。',
                icon: 'MessageSquare',
                category: 'Writing',
                url: 'https://chat.openai.com'
            }
        }),
        prisma.aITool.create({
            data: {
                name: 'Gamma',
                description: '输入大纲，一键生成精美 PPT，汇报神器。',
                icon: 'Presentation',
                category: 'Office',
                url: 'https://gamma.app'
            }
        })
    ]);

    // ============ AI Prompts ============
    await Promise.all([
        prisma.aIPrompt.create({
            data: {
                title: '供应商涨价回绝邮件',
                scenario: '采购谈判',
                content: '作为一家汽车制造商的采购经理，请帮我起草一封邮件回复给供应商...',
                tags: ['谈判', '邮件'],
                copyCount: 124
            }
        }),
        prisma.aIPrompt.create({
            data: {
                title: '合同风险条款审查',
                scenario: '法务合规',
                content: '请扮演一位资深法务专家，审查以下合同条款中的风险点...',
                tags: ['合同', '风控'],
                copyCount: 89
            }
        }),
        prisma.aIPrompt.create({
            data: {
                title: '周报生成器',
                scenario: '行政办公',
                content: '请根据以下本周完成的工作事项，生成一份结构清晰的周报...',
                tags: ['周报', '效率'],
                copyCount: 230
            }
        })
    ]);

    // ============ AI News ============
    await Promise.all([
        prisma.aINews.create({
            data: {
                title: 'OpenAI 发布 Sora：视频生成的新纪元',
                summary: '只需输入文本即可生成长达60秒的高清视频，对营销与创意领域产生深远影响。',
                tag: '#大模型'
            }
        }),
        prisma.aINews.create({
            data: {
                title: '理想汽车发布 Supply Chain LLM 白皮书',
                summary: '详细阐述了如何利用大模型优化库存周转与需求预测。',
                tag: '#内部动态',
                imageUrl: 'https://picsum.photos/id/4/200/150'
            }
        })
    ]);

    console.log('✅ Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
