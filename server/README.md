# Li-SC Platform Backend

理想汽车供应链社区平台后端 API 服务。

## 技术栈

- **框架**: Node.js + Express + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **认证**: JWT
- **部署**: Docker + Docker Compose

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等
```

### 3. 启动数据库

```bash
# 使用 Docker 启动 PostgreSQL
docker run -d --name lisc-postgres \
  -e POSTGRES_DB=lisc_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine
```

### 4. 初始化数据库

```bash
npm run db:generate  # 生成 Prisma 客户端
npm run db:push      # 推送数据库结构
npm run db:seed      # 填充初始数据
```

### 5. 启动开发服务器

```bash
npm run dev
```

服务将运行在 http://localhost:3001

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm start` | 运行生产版本 |
| `npm run db:generate` | 生成 Prisma 客户端 |
| `npm run db:migrate` | 运行数据库迁移 |
| `npm run db:push` | 推送 Schema 到数据库 |
| `npm run db:seed` | 填充初始数据 |
| `npm run db:studio` | 打开 Prisma Studio |

## API 文档

### 认证

- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 获取当前用户

### 用户

- `GET /api/users/:id` - 获取用户详情
- `PUT /api/users/:id` - 更新用户信息
- `POST /api/users/checkin` - 每日签到
- `GET /api/users/:id/points` - 获取积分记录
- `GET /api/users/leaderboard/top` - 排行榜

### 文章

- `GET /api/articles` - 文章列表
- `GET /api/articles/:id` - 文章详情
- `POST /api/articles` - 创建文章
- `PUT /api/articles/:id` - 更新文章
- `DELETE /api/articles/:id` - 删除文章
- `POST /api/articles/:id/like` - 点赞
- `POST /api/articles/:id/pin` - 置顶 (Admin)

### 评论

- `GET /api/comments` - 获取评论
- `POST /api/comments` - 创建评论
- `DELETE /api/comments/:id` - 删除评论

### 活动

- `GET /api/activities` - 活动列表
- `GET /api/activities/calendar` - 日历视图
- `GET /api/activities/:id` - 活动详情
- `POST /api/activities` - 创建活动 (Admin)
- `PUT /api/activities/:id` - 更新活动 (Admin)
- `DELETE /api/activities/:id` - 删除活动 (Admin)
- `POST /api/activities/:id/register` - 报名
- `POST /api/activities/:id/vote` - 投票

### 课程与知识库

- `GET /api/courses` - 课程列表
- `GET /api/courses/my` - 我的学习进度
- `POST /api/courses/:id/progress` - 更新进度
- `GET /api/courses/learning-paths` - 学习路径
- `GET /api/courses/knowledge-docs` - 知识库文档
- `POST /api/courses/knowledge-docs/:id/download` - 下载

### 积分商城

- `GET /api/products` - 商品列表
- `GET /api/products/categories` - 分类列表
- `POST /api/products/orders` - 创建订单
- `GET /api/products/orders` - 订单列表

### 任务

- `GET /api/tasks` - 每日任务
- `POST /api/tasks/:id/complete` - 完成任务

### 圈子

- `GET /api/wishes` - 心愿列表
- `POST /api/wishes` - 发布心愿
- `POST /api/wishes/:id/like` - 点赞
- `GET /api/wishes/food` - 美食推荐
- `POST /api/wishes/food` - 添加美食

### AI 工坊

- `GET /api/ai/tools` - AI 工具列表
- `POST /api/ai/tools/:id/click` - 记录点击
- `GET /api/ai/prompts` - Prompt 列表
- `POST /api/ai/prompts/:id/copy` - 记录复制
- `GET /api/ai/news` - AI 资讯
- `POST /api/ai/assistant/chat` - 智能问答
- `GET /api/ai/search` - 全站搜索

### 通知

- `GET /api/notifications` - 通知列表
- `POST /api/notifications/:id/read` - 标记已读
- `POST /api/notifications/read-all` - 全部已读
- `DELETE /api/notifications/:id` - 删除

## 容器化部署

```bash
# 在项目根目录执行
docker-compose up -d
```

## 测试账号

| 工号 | 密码 | 角色 |
|------|------|------|
| SC001 | 123456 | 管理员 |
| SC002 | 123456 | 普通用户 |
| SC003 | 123456 | 普通用户 |
