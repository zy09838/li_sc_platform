import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './lib/auth.js';
import { prisma } from './lib/prisma.js';
import { setCorsHeaders } from './lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, id } = req.query;

  switch (action) {
    case 'list':
      return handleList(req, res);
    case 'complete':
      return handleComplete(req, res, id);
    default:
      return res.status(400).json({ success: false, message: 'Invalid action' });
  }
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ success: false, message: '未授权' });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await prisma.dailyTask.findMany({ where: { isActive: true } });
    const completions = await prisma.userTaskCompletion.findMany({ where: { userId: user.id, completedDate: today } });
    const completedTaskIds = new Set(completions.map(c => c.taskId));

    const tasksWithStatus = tasks.map(task => ({ ...task, isCompleted: completedTaskIds.has(task.id) }));
    return res.status(200).json({ success: true, data: tasksWithStatus });
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({ success: false, message: '获取任务列表失败' });
  }
}

async function handleComplete(req: VercelRequest, res: VercelResponse, id: string | string[] | undefined) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ success: false, message: '未授权' });

  const taskId = Array.isArray(id) ? id[0] : id;
  if (!taskId) return res.status(400).json({ success: false, message: '缺少任务ID' });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const task = await prisma.dailyTask.findUnique({ where: { id: taskId } });
    if (!task) return res.status(404).json({ success: false, message: '任务不存在' });

    const existing = await prisma.userTaskCompletion.findFirst({ where: { userId: user.id, taskId, completedDate: today } });
    if (existing) return res.status(400).json({ success: false, message: '今日已完成该任务' });

    await prisma.$transaction([
      prisma.userTaskCompletion.create({ data: { userId: user.id, taskId, completedDate: today } }),
      prisma.pointTransaction.create({ data: { userId: user.id, type: 'in', amount: task.reward, reason: `完成任务：${task.title}`, relatedEntityType: 'task', relatedEntityId: taskId } }),
      prisma.user.update({ where: { id: user.id }, data: { points: { increment: task.reward } } })
    ]);

    return res.status(200).json({ success: true, data: { reward: task.reward }, message: `任务完成，获得 ${task.reward} 积分` });
  } catch (error) {
    console.error('Complete task error:', error);
    return res.status(500).json({ success: false, message: '完成任务失败' });
  }
}
