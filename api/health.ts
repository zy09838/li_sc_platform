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

      // ============ USERS ============
      const users = await Promise.all([
        prisma.user.upsert({
          where: { employeeId: 'SC001' },
          update: {},
          create: { employeeId: 'SC001', name: '朱岩滨', email: 'zhuyb@lixiang.com', password: hashedPassword, avatarUrl: 'https://picsum.photos/id/64/100/100', department: '供应链', role: 'admin', points: 980 }
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
        }),
        // AI用户 - 作为所有初始化材料的作者
        prisma.user.upsert({
          where: { employeeId: 'AI001' },
          update: {},
          create: { employeeId: 'AI001', name: 'AI', email: 'ai@lixiang.com', password: hashedPassword, avatarUrl: 'https://picsum.photos/id/1074/100/100', department: 'AI数字化', role: 'admin', points: 9999 }
        })
      ]);
      
      const aiUser = users[3]; // AI用户

      // ============ DAILY TASKS ============
      await Promise.all([
        prisma.dailyTask.upsert({ where: { id: 'task-checkin' }, update: {}, create: { id: 'task-checkin', title: '每日签到', reward: 10, type: 'checkin' } }),
        prisma.dailyTask.upsert({ where: { id: 'task-read' }, update: {}, create: { id: 'task-read', title: '阅读一篇专业发文', reward: 5, type: 'read' } }),
        prisma.dailyTask.upsert({ where: { id: 'task-download' }, update: {}, create: { id: 'task-download', title: '下载/预览知识库文档', reward: 5, type: 'download' } }),
        prisma.dailyTask.upsert({ where: { id: 'task-learn' }, update: {}, create: { id: 'task-learn', title: '完成一节课程学习', reward: 10, type: 'learn' } })
      ]);

      // ============ ARTICLES (发文专区) ============
      await Promise.all([
        // 理想汽车公司介绍与企业文化
        prisma.article.upsert({
          where: { id: 'article-company-intro' }, update: {},
          create: { 
            id: 'article-company-intro', 
            title: '理想汽车公司介绍与企业文化', 
            summary: '理想汽车成立于2015年,专注于用科技改变出行,创造移动的家。公司由李想创立,致力于为家庭用户提供智能电动车。', 
            content: `# 理想汽车公司介绍与企业文化

## 一、公司概况

**理想汽车**(Li Auto Inc.)成立于2015年7月,是中国新能源汽车制造商,专注于用科技改变出行,创造移动的家。

**核心数据**:
- 成立时间: 2015年7月
- 创始人: 李想
- 总部: 北京
- 制造基地: 江苏常州、北京
- 员工规模: 超过20,000人

## 二、企业使命与价值观

**使命**: "创造移动的家,创造幸福的家"

**愿景**: "2030年成为全球领先的人工智能企业"

**核心价值观**:
1. **用户第一** - 从用户需求出发,打造产品
2. **坚持创新** - 技术创新、商业模式创新、服务创新
3. **诚信正直** - 对用户、员工、合作伙伴诚信
4. **简单高效** - 扁平化组织,数据驱动决策
5. **卓越追求** - 产品卓越、服务卓越、团队卓越

## 三、产品矩阵

| 车型 | 定位 | 价格区间 | 动力类型 |
|------|------|----------|----------|
| 理想L6 | 中型SUV | 24.98-27.98万 | 增程式 |
| 理想L7 | 中大型SUV | 31.98-37.98万 | 增程式 |
| 理想L8 | 中大型SUV | 35.98-39.98万 | 增程式 |
| 理想L9 | 全尺寸SUV | 42.98-45.98万 | 增程式 |
| 理想MEGA | 纯电MPV | 55.98万 | 纯电动 |

## 四、核心技术

- **增程式电动技术**: 续航无焦虑,综合续航超1200km
- **智能驾驶AD Max**: 双Orin-X芯片,NOA高速/城市领航
- **智能座舱**: 五屏交互,高通8295芯片

## 五、常州制造基地

- 占地面积: 约1000亩
- 年产能: 40万辆
- 自动化率: 行业领先
- 认证: IATF 16949、ISO 14001`, 
            authorId: aiUser.id, 
            category: '公司动态', 
            tags: ['企业文化', '公司介绍', '理想汽车'], 
            imageUrl: 'https://picsum.photos/id/1076/400/300', 
            views: 2856, 
            likes: 189, 
            isTop: true, 
            isOfficial: true, 
            status: 'published', 
            publishedAt: new Date() 
          }
        }),

        // 理想汽车2025-2026年供应链动态
        prisma.article.upsert({
          where: { id: 'article-sc-strategy' }, update: {},
          create: { 
            id: 'article-sc-strategy', 
            title: '理想汽车2025-2026年供应链战略动态', 
            summary: '全面解析理想汽车供应链垂直整合战略、本地化供应链建设、数字化转型及2025-2026年关键指标目标。', 
            content: `# 理想汽车2025-2026年供应链动态

## 一、供应链战略布局

### 1.1 垂直整合战略
- 增程式动力系统自主研发
- 智能驾驶芯片与算法平台自研
- 动力电池PACK自主生产能力

### 1.2 核心供应商合作
- 宁德时代: 动力电池战略合作伙伴
- 地平线: 智能驾驶芯片供应商
- 禾赛科技: 激光雷达供应商
- 安波福: 线束系统供应商

### 1.3 本地化供应链建设
- 在常州及周边地区建立供应商集群
- 推动"30分钟供应圈"建设
- 降低物流成本,提升响应速度

## 二、2025年重点动态

### 2.1 产能扩张
- 常州制造基地产能目标: 年产40万辆
- 北京绿色智能工厂投产
- 启动第三工厂选址规划

### 2.2 数字化转型
- 供应链全流程数字化管理平台上线
- 与供应商建立EDI电子数据交换系统
- 实施供应商协同管理系统(SCM)

### 2.3 成本控制
- 推进零部件国产化替代
- 优化供应商结构,引入竞争机制
- 实施年度降本目标(目标降本5-8%)

## 三、关键指标

| 指标项 | 2025目标 | 2026目标 |
|--------|----------|----------|
| 准时交付率 | ≥98% | ≥99% |
| 供应商质量PPM | ≤100 | ≤50 |
| 国产化率 | 85% | 90% |
| 库存周转天数 | ≤15天 | ≤12天 |
| 供应商数字化率 | 80% | 95% |`, 
            authorId: aiUser.id, 
            category: '供应链发文', 
            tags: ['供应链', '战略规划', '2025'], 
            imageUrl: 'https://picsum.photos/id/1068/400/300', 
            views: 1856, 
            likes: 145, 
            isTop: true, 
            isOfficial: true, 
            status: 'published', 
            publishedAt: new Date() 
          }
        }),

        // 常州市新能源汽车产业政策
        prisma.article.upsert({
          where: { id: 'article-changzhou-policy' }, update: {},
          create: { 
            id: 'article-changzhou-policy', 
            title: '常州市新能源汽车产业政策汇编', 
            summary: '常州市2025年新能源汽车产量目标突破80万辆,产业链产值超3000亿元。涵盖财政支持、税收优惠、人才政策等全面解读。', 
            content: `# 常州市新能源汽车产业政策汇编

## 一、产业发展目标

### 2025年目标
- 新能源汽车产量突破80万辆
- 产业链产值超3000亿元
- 培育龙头企业5-8家

### 区域布局
- **武进区**: 整车制造核心区(理想汽车、比亚迪)
- **新北区**: 动力电池与电驱产业集群
- **金坛区**: 动力电池材料产业基地
- **溧阳市**: 动力电池及储能产业园

## 二、财政支持政策

### 企业落户奖励
- 整车企业投资≥50亿元,奖励最高5000万元
- 核心零部件企业投资≥10亿元,奖励最高1000万元

### 研发创新支持
- 研发费用补贴: 按投入10%给予补助,最高1000万元/年
- 发明专利授权奖励: 2万元/件

### 产能达标奖励
- 年产量达10万辆: 奖励2000万元
- 年产量达20万辆: 追加奖励3000万元

## 三、人才政策

### 高层次人才引进
- 顶尖人才安家补贴: 300万元
- 领军人才安家补贴: 100万元
- 硕士研究生生活补贴: 3万元

## 四、政策咨询

- 常州市工信局: 0519-85681500
- 武进区: 0519-86310206
- 新北区: 0519-85127710`, 
            authorId: aiUser.id, 
            category: '产业政策', 
            tags: ['常州', '产业政策', '新能源'], 
            imageUrl: 'https://picsum.photos/id/1048/400/300', 
            views: 1256, 
            likes: 98, 
            status: 'published', 
            publishedAt: new Date() 
          }
        }),

        // 常州工厂最新消息
        prisma.article.upsert({
          where: { id: 'article-changzhou-factory' }, update: {},
          create: { 
            id: 'article-changzhou-factory', 
            title: '理想汽车常州工厂2025年最新动态', 
            summary: '理想汽车常州工厂位于武进国家高新技术产业开发区,投资超100亿元,产能目标40万辆。2025年智能化升级与产能扩建进展详解。', 
            content: `# 理想汽车常州工厂最新消息

## 一、工厂概况

- **地理位置**: 江苏省常州市武进国家高新技术产业开发区
- **占地面积**: 约1000亩
- **投资规模**: 超100亿元人民币
- **当前产能**: 年产25万辆
- **规划产能**: 年产40万辆(扩建后)

## 二、2024-2025年最新动态

### 产能扩建
- 新增焊装线2条,总装线扩容升级
- 投资额约30亿元
- 预计2025年6月正式达产

### 智能化升级
- 部署工业互联网平台
- 引入AGV智能物流系统100+台
- 焊装自动化率提升至99.5%

### 新车型导入
- 纯电平台生产线改造
- 800V高压平台工艺准备
- CTB电池集成技术导入

## 三、供应链协同

### 本地化供应链
- 园区内配套供应商: 15家
- 30分钟供应圈供应商: 80+家
- 本地化采购比例: >60%

### JIT配送
- 实施Milk Run循环取货
- 平均配送频次: 4-6次/天

## 四、员工规模

- 在职员工: 约8000人
- 技术人员: 约2000人
- 2025年招聘计划: 社招210人+校招300人

## 五、荣誉与认可

- 工信部"绿色工厂"称号
- 江苏省"智能制造示范工厂"
- 常州市"工业企业综合实力50强"`, 
            authorId: aiUser.id, 
            category: '公司动态', 
            tags: ['常州工厂', '智能制造', '产能扩建'], 
            imageUrl: 'https://picsum.photos/id/1015/400/300', 
            views: 2156, 
            likes: 167, 
            status: 'published', 
            publishedAt: new Date() 
          }
        }),

        // 供应链KPI指标
        prisma.article.upsert({
          where: { id: 'article-kpi-dashboard' }, update: {},
          create: { 
            id: 'article-kpi-dashboard', 
            title: '供应链团队KPI仪表盘指标参考', 
            summary: '全面的供应链KPI指标体系,涵盖交付、质量、成本、库存、供应商管理、风险管理等七大维度,助力数据驱动决策。', 
            content: `# 供应链团队KPI仪表盘指标参考

## 一、KPI指标体系框架

供应链KPI指标体系
├── 交付类指标 (Delivery)
├── 质量类指标 (Quality)
├── 成本类指标 (Cost)
├── 库存类指标 (Inventory)
├── 供应商管理指标
├── 风险管理指标
└── 运营效率指标

## 二、核心KPI指标

### 交付类指标
- **准时交付率(OTD)**: 目标≥98%
- **交付周期**: 标准件≤30天,定制件≤60天
- **订单完成率**: 目标≥95%

### 质量类指标
- **来料合格率**: 目标≥98%
- **供应商PPM**: 战略供应商≤50,核心供应商≤100
- **质量问题响应**: 严重2h内,一般24h内

### 成本类指标
- **采购成本降低率**: 年度降本5-8%
- **TCO总拥有成本**: 采购+质量+物流+库存+管理
- **价格竞争力指数**: 优于市场5%以上

### 库存类指标
- **库存周转率**: ≥24次/年 (≤15天)
- **呆滞库存率**: ≤2%
- **库存准确率**: ≥99%

### 供应商管理
- **供应商综合评分**: A级≥90分,B级80-89分
- **供应商开发周期**: 标准件≤3个月
- **双供应商覆盖率**: ≥80%

## 三、行业标杆对比

| KPI指标 | 行业平均 | 领先水平 | 理想目标 |
|---------|----------|----------|----------|
| 准时交付率 | 95% | 98% | ≥98% |
| 来料合格率 | 96% | 99% | ≥98% |
| 供应商PPM | 200 | <50 | ≤100 |
| 库存周转天数 | 20天 | 12天 | ≤15天 |

## 四、数字化工具推荐

- **BI工具**: Tableau、Power BI、帆软FineBI
- **协同工具**: 飞书/钉钉KPI播报与预警`, 
            authorId: aiUser.id, 
            category: '知识分享', 
            tags: ['KPI', '供应链', '数据分析'], 
            imageUrl: 'https://picsum.photos/id/1005/400/300', 
            views: 1589, 
            likes: 134, 
            status: 'published', 
            publishedAt: new Date() 
          }
        }),

        // 行业周报模板
        prisma.article.upsert({
          where: { id: 'article-report-template' }, update: {},
          create: { 
            id: 'article-report-template', 
            title: '新能源汽车行业周报/月报模板', 
            summary: '标准化的新能源汽车行业周报与月报模板,涵盖市场数据、政策动态、企业动态、供应链风险、竞争分析等模块。', 
            content: `# 新能源汽车行业周报/月报模板

## 周报模板

### 一、本周要闻
- **政策动态**: 时间、政策名称、影响分析
- **市场数据**: 
  - 本周新能源汽车销量
  - 纯电动/插混车型占比
  - 品牌市场份额

### 二、行业热点
- **技术创新**: 固态电池、智能驾驶、800V平台
- **产业链动态**: 碳酸锂价格、电池厂商动态
- **投融资事件**: 企业、轮次、金额、投资方

### 三、供应链专题
- **风险提示**: 芯片短缺、原材料价格、物流
- **供应商动态**: 关键供应商新闻
- **机会**: 新供应商、国产替代、降本方向

### 四、竞争分析
- **新车上市**: 品牌、车型、价格、亮点
- **价格调整**: 降价/限时优惠
- **销量排行**: TOP10车型

### 五、下周展望
- 重要事件预告
- 关注重点
- 风险提示

---

## 月报模板

### 执行摘要
- 核心观点(3条)
- 关键数据: 销量、同比/环比、渗透率

### 市场概况
- 整体市场销量数据表格
- 品牌排行TOP10
- 区域市场分析

### 政策环境
- 国家政策
- 地方政策
- 对理想汽车影响分析

### 企业动态
- 理想汽车: 产销数据、重要事件、新车进展
- 竞争对手: 比亚迪、特斯拉、蔚小理

### 产业链分析
- 上游原材料价格走势
- 动力电池装机量
- 智能驾驶技术进展

### 下月展望与行动建议`, 
            authorId: aiUser.id, 
            category: '知识分享', 
            tags: ['周报', '月报', '模板'], 
            imageUrl: 'https://picsum.photos/id/1024/400/300', 
            views: 1123, 
            likes: 89, 
            status: 'published', 
            publishedAt: new Date() 
          }
        })
      ]);

      // ============ COURSES (培训中心) ============
      await Promise.all([
        prisma.course.upsert({ 
          where: { id: 'course-iatf16949' }, 
          update: {}, 
          create: { 
            id: 'course-iatf16949', 
            title: 'IATF 16949 质量管理体系培训', 
            instructor: 'AI', 
            thumbnailUrl: 'https://picsum.photos/id/1/400/300', 
            duration: '56学时(7天)', 
            category: '质量管理', 
            description: '国际汽车工作组制定的质量管理体系标准培训,涵盖标准解读、内审员认证、实操演练。培训目标:理解IATF 16949标准要求,掌握汽车行业质量管理方法,具备内审员资格。', 
            videoCount: 28 
          } 
        }),
        prisma.course.upsert({ 
          where: { id: 'course-procurement' }, 
          update: {}, 
          create: { 
            id: 'course-procurement', 
            title: '汽车行业采购员培训课程', 
            instructor: 'AI', 
            thumbnailUrl: 'https://picsum.photos/id/180/400/300', 
            duration: '32学时', 
            category: '采购管理', 
            description: '分为基础、进阶、高级三个层级的系统培训。涵盖采购流程、供应商开发、成本分析、谈判技巧、合同管理、风险管理等完整知识体系。', 
            videoCount: 20 
          } 
        }),
        prisma.course.upsert({ 
          where: { id: 'course-sc-training' }, 
          update: {}, 
          create: { 
            id: 'course-sc-training', 
            title: '理想汽车供应链培训体系', 
            instructor: 'AI', 
            thumbnailUrl: 'https://picsum.photos/id/119/400/300', 
            duration: '持续学习', 
            category: '供应链管理', 
            description: '理想汽车供应链完整培训体系介绍,包括新员工入职培训、专业能力培训(采购/SQE/物流/计划)、通用技能培训、领导力培训及专项培训计划。', 
            videoCount: 15 
          } 
        }),
        prisma.course.upsert({ 
          where: { id: 'course-apqp' }, 
          update: {}, 
          create: { 
            id: 'course-apqp', 
            title: 'APQP产品质量先期策划', 
            instructor: 'AI', 
            thumbnailUrl: 'https://picsum.photos/id/96/400/300', 
            duration: '16学时', 
            category: '质量管理', 
            description: '汽车行业五大工具之一,涵盖APQP五大阶段:计划和定义项目、产品设计和开发、过程设计和开发、产品和过程确认、反馈评定和纠正措施。', 
            videoCount: 10 
          } 
        }),
        prisma.course.upsert({ 
          where: { id: 'course-negotiation' }, 
          update: {}, 
          create: { 
            id: 'course-negotiation', 
            title: '采购谈判技巧进阶', 
            instructor: 'AI', 
            thumbnailUrl: 'https://picsum.photos/id/103/400/300', 
            duration: '16学时', 
            category: '采购管理', 
            description: '高级谈判策略培训,包括哈佛谈判法、BATNA运用、锚定效应、困难谈判应对(强势供应商/垄断供应商)、谈判心理学及实战演练。', 
            videoCount: 8 
          } 
        }),
        prisma.course.upsert({ 
          where: { id: 'course-spc' }, 
          update: {}, 
          create: { 
            id: 'course-spc', 
            title: 'SPC统计过程控制', 
            instructor: 'AI', 
            thumbnailUrl: 'https://picsum.photos/id/160/400/300', 
            duration: '16学时', 
            category: '质量管理', 
            description: '汽车行业五大工具之一,涵盖控制图原理、Cpk过程能力分析、过程稳定性判定、8大判异规则及过程异常处理。', 
            videoCount: 8 
          } 
        })
      ]);

      // ============ ACTIVITIES (活动专区) ============
      const now = new Date();
      await Promise.all([
        prisma.activity.upsert({
          where: { id: 'activity-supplier-conference' }, 
          update: {},
          create: { 
            id: 'activity-supplier-conference', 
            title: '2025理想汽车供应商大会', 
            description: `主题:"智领未来·共创卓越"

活动目标:
- 战略传递: 发布2025年供应链战略与业务规划
- 关系维护: 加强与核心供应商的战略合作关系
- 激励表彰: 表彰年度优秀供应商
- 能力提升: 分享行业趋势与最佳实践

活动安排:
- 9:00-9:45 CEO致辞
- 9:45-10:30 供应链战略发布
- 10:45-11:30 优秀供应商表彰
- 11:30-12:00 战略合作协议签署
- 13:30-14:30 分论坛(质量/数字化/ESG)
- 14:30-15:30 供应商代表分享

表彰奖项:
- 年度最佳战略合作伙伴(3家)
- 年度卓越质量奖(10家)
- 年度最佳交付奖(10家)
- 年度技术创新奖(5家)`, 
            imageUrl: 'https://picsum.photos/id/1062/400/300', 
            date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000), 
            location: '常州香格里拉大酒店', 
            status: 'upcoming', 
            maxParticipants: 300, 
            isQuarterly: true,
            createdById: aiUser.id 
          }
        }),
        prisma.activity.upsert({
          where: { id: 'activity-quality-workshop' }, 
          update: {},
          create: { 
            id: 'activity-quality-workshop', 
            title: '零缺陷质量管理工作坊', 
            description: `主题: 构建零缺陷质量体系

培训内容:
- IATF 16949体系要求解读
- 理想汽车质量标准
- 供应商质量改进案例分享
- FMEA失效模式分析实战
- 8D问题解决方法应用

适合对象:
- SQE供应商质量工程师
- 采购工程师
- 质量管理人员`, 
            imageUrl: 'https://picsum.photos/id/1048/400/300', 
            date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), 
            location: '常州基地培训中心', 
            status: 'upcoming', 
            maxParticipants: 50, 
            createdById: aiUser.id 
          }
        }),
        prisma.activity.upsert({
          where: { id: 'activity-digital-training' }, 
          update: {},
          create: { 
            id: 'activity-digital-training', 
            title: '供应链数字化转型培训', 
            description: `主题: AI赋能供应链数字化

培训内容:
- SRM系统使用培训
- EDI电子数据交换对接指南
- 数字化协同案例分享
- AI在供应链中的应用案例
- ChatGPT/Claude供应链场景应用

实操环节:
- 系统操作演示
- AI工具实践`, 
            imageUrl: 'https://picsum.photos/id/1074/400/300', 
            date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), 
            location: '常州基地培训中心', 
            status: 'upcoming', 
            maxParticipants: 40, 
            createdById: aiUser.id 
          }
        })
      ]);

      // ============ AI TOOLS (AI赋能) ============
      await Promise.all([
        prisma.aITool.upsert({ where: { id: 'ai-tool-chatgpt' }, update: {}, create: { id: 'ai-tool-chatgpt', name: 'ChatGPT', description: 'OpenAI开发的大语言模型,支持对话、写作、代码生成、数据分析等多种任务', icon: 'Bot', category: 'Writing', url: 'https://chat.openai.com', clickCount: 1256 } }),
        prisma.aITool.upsert({ where: { id: 'ai-tool-claude' }, update: {}, create: { id: 'ai-tool-claude', name: 'Claude', description: 'Anthropic开发的AI助手,擅长长文本处理、分析报告、专业写作', icon: 'MessageSquare', category: 'Writing', url: 'https://claude.ai', clickCount: 987 } }),
        prisma.aITool.upsert({ where: { id: 'ai-tool-midjourney' }, update: {}, create: { id: 'ai-tool-midjourney', name: 'Midjourney', description: 'AI图像生成工具,可用于PPT配图、产品概念图、海报设计', icon: 'Image', category: 'Image', url: 'https://midjourney.com', clickCount: 756 } }),
        prisma.aITool.upsert({ where: { id: 'ai-tool-gamma' }, update: {}, create: { id: 'ai-tool-gamma', name: 'Gamma', description: 'AI驱动的PPT/文档生成工具,输入主题自动生成精美演示文稿', icon: 'Presentation', category: 'Office', url: 'https://gamma.app', clickCount: 654 } }),
        prisma.aITool.upsert({ where: { id: 'ai-tool-copilot' }, update: {}, create: { id: 'ai-tool-copilot', name: 'GitHub Copilot', description: 'AI编程助手,支持代码补全、代码生成、代码解释', icon: 'Code', category: 'Data', url: 'https://github.com/features/copilot', clickCount: 543 } }),
        prisma.aITool.upsert({ where: { id: 'ai-tool-notion-ai' }, update: {}, create: { id: 'ai-tool-notion-ai', name: 'Notion AI', description: 'Notion内置AI助手,支持文档写作、总结、翻译、头脑风暴', icon: 'FileText', category: 'Office', url: 'https://notion.so', clickCount: 432 } })
      ]);

      // ============ AI PROMPTS (AI赋能) ============
      await Promise.all([
        prisma.aIPrompt.upsert({ where: { id: 'prompt-rfq-email' }, update: {}, create: { id: 'prompt-rfq-email', title: '供应商询价邮件模板', scenario: '采购场景', content: `请帮我撰写一封专业的询价邮件,要求如下:

收件人:【供应商名称】采购经理
产品:【零件名称及规格】
数量:【年度预计用量】
技术要求:【关键技术指标】

其他要求:
- 需要提供样品
- 报价需包含模具费用
- 要求IATF 16949认证
- 付款条件:月结60天

请使用专业但友好的语气,邮件需包含:自我介绍、项目背景、报价要求清单、回复截止日期、联系方式`, tags: ['采购', '邮件', '询价'], copyCount: 156, authorId: aiUser.id } }),
        
        prisma.aIPrompt.upsert({ where: { id: 'prompt-negotiation' }, update: {}, create: { id: 'prompt-negotiation', title: '价格谈判策略准备', scenario: '采购场景', content: `我即将与供应商进行价格谈判,请帮我准备谈判策略:

背景信息:
- 零件:【零件名称】
- 供应商报价:【X元/件】
- 市场价格区间:【Y-Z元/件】
- 年度采购量:【XX万件】

请提供:
1. 合理目标价格分析
2. 3个谈判论据(成本分析、竞争对比、批量优势)
3. 让步策略(3步让步计划)
4. 可能的补偿方案
5. BATNA(最佳替代方案)建议`, tags: ['采购', '谈判', '策略'], copyCount: 134, authorId: aiUser.id } }),
        
        prisma.aIPrompt.upsert({ where: { id: 'prompt-8d-report' }, update: {}, create: { id: 'prompt-8d-report', title: '8D报告编写辅助', scenario: '质量管理', content: `请帮我编写一份8D问题解决报告:

问题描述:
- 零件:【零件名称】
- 问题:【具体问题描述】
- 发现时间:【日期】
- 批次:【批号】
- 不良数量:【X件/Y件】

已知信息:
- D3临时措施:【已采取措施】
- 初步分析:【可能原因】

请帮我完善:
D4根本原因分析:请用5Why方法深挖根因
D5永久纠正措施:提供3个可行方案并评估
D7预防再发措施:从设计、工艺、管理三维度`, tags: ['质量', '8D', '问题解决'], copyCount: 189, authorId: aiUser.id } }),
        
        prisma.aIPrompt.upsert({ where: { id: 'prompt-supplier-report' }, update: {}, create: { id: 'prompt-supplier-report', title: '供应商绩效分析报告', scenario: '供应商管理', content: `请根据以下供应商绩效数据,生成一份专业的月度分析报告:

供应商:【供应商名称】
评估月份:【YYYY年M月】

数据:
- 准时交付率:XX%(目标≥95%)
- 来料合格率:XX%(目标≥98%)
- PPM:XXX(目标≤100)
- 响应速度:平均XX小时(目标≤24小时)

请生成包含以下内容的报告:
1. 执行摘要
2. 各项指标达成情况分析(用表格)
3. 主要问题识别
4. 根本原因分析
5. 改进建议
6. 下月关注重点`, tags: ['供应商', '绩效', '报告'], copyCount: 112, authorId: aiUser.id } }),
        
        prisma.aIPrompt.upsert({ where: { id: 'prompt-fmea' }, update: {}, create: { id: 'prompt-fmea', title: 'PFMEA失效模式分析', scenario: '质量管理', content: `请帮我进行PFMEA(过程失效模式分析):

过程:【工序名称】
产品:【产品名称】
关键质量特性:【特性及公差】

请分析:
1. 可能的失效模式(列出5个)
2. 每个失效模式的:
   - 失效后果
   - 严重度评分(S:1-10)
   - 可能原因(2-3个)
   - 发生度评分(O:1-10)
   - 现有控制方法
   - 探测度评分(D:1-10)
   - RPN计算(S×O×D)
3. 对RPN>100的项目,提供改进建议

请用表格形式输出。`, tags: ['FMEA', '质量', '风险分析'], copyCount: 98, authorId: aiUser.id } })
      ]);

      // ============ AI NEWS (AI赋能) ============
      await Promise.all([
        prisma.aINews.upsert({ where: { id: 'ai-news-1' }, update: {}, create: { id: 'ai-news-1', title: 'AI驱动的需求预测系统实现90%准确率', summary: '某汽车制造商通过LSTM神经网络+时间序列分析,将需求预测准确率从75%提升至90%,库存成本降低25%', imageUrl: 'https://picsum.photos/id/1/400/300', tag: '需求预测', publishedAt: new Date() } }),
        prisma.aINews.upsert({ where: { id: 'ai-news-2' }, update: {}, create: { id: 'ai-news-2', title: '机器视觉质量检测:准确率99.5%的工业应用', summary: '基于CNN卷积神经网络的视觉检测系统,检测速度1000件/小时,漏检率<0.1%,ROI回收期8个月', imageUrl: 'https://picsum.photos/id/48/400/300', tag: '质量检测', publishedAt: new Date() } }),
        prisma.aINews.upsert({ where: { id: 'ai-news-3' }, update: {}, create: { id: 'ai-news-3', title: '供应商财务风险AI预警系统上线', summary: '通过机器学习分析供应商财务报表、工商信息、新闻舆情等数据,提前3-6个月预警供应商风险', imageUrl: 'https://picsum.photos/id/96/400/300', tag: '风险管理', publishedAt: new Date() } }),
        prisma.aINews.upsert({ where: { id: 'ai-news-4' }, update: {}, create: { id: 'ai-news-4', title: '智能仓储AGV调度优化:效率提升50%', summary: 'AI调度算法优化AGV路径与任务分配,拣货效率提升50%,AGV利用率从60%提升至85%', imageUrl: 'https://picsum.photos/id/119/400/300', tag: '物流优化', publishedAt: new Date() } }),
        prisma.aINews.upsert({ where: { id: 'ai-news-5' }, update: {}, create: { id: 'ai-news-5', title: '大语言模型在供应链的应用趋势', summary: 'ChatGPT/Claude等大模型正在变革供应链工作方式:自动生成报告、智能客服、文档分析、邮件撰写', imageUrl: 'https://picsum.photos/id/180/400/300', tag: 'LLM应用', publishedAt: new Date() } })
      ]);

      // ============ FOOD RECOMMENDATIONS (动态广场) ============
      await Promise.all([
        prisma.foodRecommendation.upsert({ where: { id: 'food-tianmuhu' }, update: {}, create: { id: 'food-tianmuhu', name: '天目湖砂锅鱼头', rating: 4.8, imageUrl: 'https://picsum.photos/id/292/400/300', tags: ['常州招牌', '鲜美', '汤汁浓郁'], recommenderId: aiUser.id } }),
        prisma.foodRecommendation.upsert({ where: { id: 'food-yinsimian' }, update: {}, create: { id: 'food-yinsimian', name: '常州银丝面', rating: 4.6, imageUrl: 'https://picsum.photos/id/312/400/300', tags: ['早餐', '面条', '爆鱼面'], recommenderId: aiUser.id } }),
        prisma.foodRecommendation.upsert({ where: { id: 'food-xiaolongbao' }, update: {}, create: { id: 'food-xiaolongbao', name: '加蟹小笼包', rating: 4.7, imageUrl: 'https://picsum.photos/id/429/400/300', tags: ['早点', '蟹黄', '汤汁丰富'], recommenderId: aiUser.id } }),
        prisma.foodRecommendation.upsert({ where: { id: 'food-luobogan' }, update: {}, create: { id: 'food-luobogan', name: '常州萝卜干', rating: 4.5, imageUrl: 'https://picsum.photos/id/488/400/300', tags: ['特产', '下饭菜', '伴手礼'], recommenderId: aiUser.id } }),
        prisma.foodRecommendation.upsert({ where: { id: 'food-damagao' }, update: {}, create: { id: 'food-damagao', name: '大麻糕', rating: 4.4, imageUrl: 'https://picsum.photos/id/431/400/300', tags: ['传统糕点', '香脆酥松'], recommenderId: aiUser.id } }),
        prisma.foodRecommendation.upsert({ where: { id: 'food-jiangnan' }, update: {}, create: { id: 'food-jiangnan', name: '江南食府', rating: 4.6, imageUrl: 'https://picsum.photos/id/315/400/300', tags: ['本帮菜', '商务宴请', '距工厂5km'], recommenderId: aiUser.id } }),
        prisma.foodRecommendation.upsert({ where: { id: 'food-yuweixiaoyu' }, update: {}, create: { id: 'food-yuweixiaoyu', name: '渝味晓宇火锅', rating: 4.5, imageUrl: 'https://picsum.photos/id/326/400/300', tags: ['重庆火锅', '麻辣鲜香', '团队聚餐'], recommenderId: aiUser.id } }),
        prisma.foodRecommendation.upsert({ where: { id: 'food-lanyuewan' }, update: {}, create: { id: 'food-lanyuewan', name: '西太湖揽月湾', rating: 4.7, imageUrl: 'https://picsum.photos/id/342/400/300', tags: ['湖景餐厅', '太湖三白', '周末聚餐'], recommenderId: aiUser.id } }),
        prisma.foodRecommendation.upsert({ where: { id: 'food-bbq' }, update: {}, create: { id: 'food-bbq', name: '湖塘夜市烧烤街', rating: 4.4, imageUrl: 'https://picsum.photos/id/365/400/300', tags: ['夜宵', '羊肉串', '小龙虾'], recommenderId: aiUser.id } }),
        prisma.foodRecommendation.upsert({ where: { id: 'food-haidilao' }, update: {}, create: { id: 'food-haidilao', name: '海底捞火锅(新北万达)', rating: 4.6, imageUrl: 'https://picsum.photos/id/376/400/300', tags: ['火锅', '服务好', '家庭聚餐'], recommenderId: aiUser.id } })
      ]);

      // ============ PRODUCTS (积分商城) ============
      await Promise.all([
        prisma.product.upsert({ where: { id: 'product-1' }, update: {}, create: { id: 'product-1', name: '理想定制保温杯', price: 200, imageUrl: 'https://picsum.photos/id/225/400/300', category: '生活用品', stock: 100, tags: ['新品', '限量'], isHot: true, isNew: true } }),
        prisma.product.upsert({ where: { id: 'product-2' }, update: {}, create: { id: 'product-2', name: '理想鼠标垫', price: 80, imageUrl: 'https://picsum.photos/id/96/400/300', category: '办公用品', stock: 200, tags: ['热销'], isHot: true } }),
        prisma.product.upsert({ where: { id: 'product-3' }, update: {}, create: { id: 'product-3', name: '理想定制卫衣', price: 500, imageUrl: 'https://picsum.photos/id/91/400/300', category: '服饰', stock: 50, tags: ['限量', '冬季'], isNew: true } }),
        prisma.product.upsert({ where: { id: 'product-4' }, update: {}, create: { id: 'product-4', name: '理想笔记本套装', price: 120, imageUrl: 'https://picsum.photos/id/180/400/300', category: '办公用品', stock: 150, tags: ['热销'] } }),
        prisma.product.upsert({ where: { id: 'product-5' }, update: {}, create: { id: 'product-5', name: '理想车载香薰', price: 150, imageUrl: 'https://picsum.photos/id/119/400/300', category: '生活用品', stock: 80, tags: ['新品'], isNew: true } })
      ]);

      // ============ LEARNING PATHS (培训中心) ============
      await Promise.all([
        prisma.learningPath.upsert({ where: { id: 'path-procurement' }, update: {}, create: { id: 'path-procurement', title: '采购新兵训练营', description: '从零开始,掌握理想汽车采购流程与供应商管理基础', icon: '🎯', stepsCount: 5, level: 'Beginner' } }),
        prisma.learningPath.upsert({ where: { id: 'path-sc-expert' }, update: {}, create: { id: 'path-sc-expert', title: '供应链计划专家', description: '深钻需求预测、库存优化与风险管理,提升全局规划力', icon: '📊', stepsCount: 8, level: 'Advanced' } }),
        prisma.learningPath.upsert({ where: { id: 'path-strategic' }, update: {}, create: { id: 'path-strategic', title: '战略采购领航员', description: '掌握复杂谈判技巧与全球供应链网络设计', icon: '🚢', stepsCount: 12, level: 'Expert' } }),
        prisma.learningPath.upsert({ where: { id: 'path-sqe' }, update: {}, create: { id: 'path-sqe', title: 'SQE质量专家成长路径', description: '从初级SQE到质量专家,掌握IATF16949、五大工具、供应商审核', icon: '🔍', stepsCount: 10, level: 'Advanced' } })
      ]);

      await prisma.$disconnect();

      return res.status(200).json({
        success: true,
        message: '数据库初始化完成(含所有初始化材料)',
        data: { 
          users: users.length,
          modules: ['文章', '课程', '活动', 'AI工具', 'AI提示词', 'AI新闻', '美食推荐', '商品', '学习路径']
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: '初始化失败: ' + (error.message || '未知错误') });
    }
  }

  return res.status(400).json({ success: false, message: 'Invalid action' });
}
