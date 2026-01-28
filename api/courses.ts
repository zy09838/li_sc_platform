import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../src/lib/auth.js';
import { prisma } from '../src/lib/prisma.js';
import { setCorsHeaders } from '../src/lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, id } = req.query;

  switch (action) {
    case 'list':
      return handleList(req, res);
    case 'my':
      return handleMy(req, res);
    case 'learning-paths':
      return handleLearningPaths(req, res);
    case 'knowledge-docs':
      return handleKnowledgeDocs(req, res);
    case 'progress':
      return handleProgress(req, res, id);
    case 'download':
      return handleDownload(req, res, id);
    default:
      return res.status(400).json({ success: false, message: 'Invalid action' });
  }
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  try {
    const { category, page = '1', limit = '10' } = req.query;
    const where: any = { status: 'active' };
    if (category) where.category = category;
    const skip = (Number(page) - 1) * Number(limit);

    const [courses, total] = await Promise.all([
      prisma.course.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
      prisma.course.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: { courses, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    return res.status(500).json({ success: false, message: '获取课程列表失败' });
  }
}

async function handleMy(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ success: false, message: '未授权' });

  try {
    const progress = await prisma.userCourseProgress.findMany({
      where: { userId: user.id },
      include: { course: true },
      orderBy: { lastStudiedAt: 'desc' }
    });
    return res.status(200).json({ success: true, data: progress });
  } catch (error) {
    console.error('Get my courses error:', error);
    return res.status(500).json({ success: false, message: '获取学习进度失败' });
  }
}

async function handleLearningPaths(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  try {
    const paths = await prisma.learningPath.findMany();
    return res.status(200).json({ success: true, data: paths });
  } catch (error) {
    console.error('Get learning paths error:', error);
    return res.status(500).json({ success: false, message: '获取学习路径失败' });
  }
}

async function handleKnowledgeDocs(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  try {
    const { category, search, page = '1', limit = '20' } = req.query;
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
      prisma.knowledgeDoc.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
      prisma.knowledgeDoc.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: { docs, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }
    });
  } catch (error) {
    console.error('Get docs error:', error);
    return res.status(500).json({ success: false, message: '获取文档列表失败' });
  }
}

async function handleProgress(req: VercelRequest, res: VercelResponse, id: string | string[] | undefined) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ success: false, message: '未授权' });

  const courseId = Array.isArray(id) ? id[0] : id;
  if (!courseId) return res.status(400).json({ success: false, message: '缺少课程ID' });

  try {
    const { progress } = req.body;
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ success: false, message: '课程不存在' });

    const existing = await prisma.userCourseProgress.findUnique({ where: { userId_courseId: { userId: user.id, courseId } } });
    const isNewCompletion = progress >= 100 && (!existing || existing.progress < 100);

    const updated = await prisma.userCourseProgress.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      create: { userId: user.id, courseId, progress, lastStudiedAt: new Date(), completedAt: progress >= 100 ? new Date() : null },
      update: { progress, lastStudiedAt: new Date(), completedAt: progress >= 100 ? new Date() : undefined }
    });

    if (isNewCompletion) {
      await prisma.$transaction([
        prisma.pointTransaction.create({ data: { userId: user.id, type: 'in', amount: 50, reason: `完成课程《${course.title}》`, relatedEntityType: 'course', relatedEntityId: courseId } }),
        prisma.user.update({ where: { id: user.id }, data: { points: { increment: 50 } } })
      ]);
    }
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update progress error:', error);
    return res.status(500).json({ success: false, message: '更新进度失败' });
  }
}

async function handleDownload(req: VercelRequest, res: VercelResponse, id: string | string[] | undefined) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ success: false, message: '未授权' });

  const docId = Array.isArray(id) ? id[0] : id;
  if (!docId) return res.status(400).json({ success: false, message: '缺少文档ID' });

  try {
    const doc = await prisma.knowledgeDoc.update({ where: { id: docId }, data: { downloads: { increment: 1 } } });
    return res.status(200).json({ success: true, data: { downloadUrl: doc.fileUrl } });
  } catch (error) {
    console.error('Download doc error:', error);
    return res.status(500).json({ success: false, message: '下载失败' });
  }
}
