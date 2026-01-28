import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { setCorsHeaders } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await prisma.dailyTask.findMany({
      where: { isActive: true }
    });

    const completions = await prisma.userTaskCompletion.findMany({
      where: {
        userId: user.id,
        completedDate: today
      }
    });

    const completedTaskIds = new Set(completions.map(c => c.taskId));

    const tasksWithStatus = tasks.map(task => ({
      ...task,
      isCompleted: completedTaskIds.has(task.id)
    }));

    return res.status(200).json({ success: true, data: tasksWithStatus });
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({ success: false, message: '获取任务列表失败' });
  }
}
