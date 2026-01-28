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
    case 'delete':
      return handleDelete(req, res, id);
    case 'read':
      return handleRead(req, res, id);
    case 'read-all':
      return handleReadAll(req, res);
    default:
      return res.status(400).json({ success: false, message: 'Invalid action' });
  }
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ success: false, message: '未授权' });

  try {
    const { page = '1', limit = '20', unreadOnly } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { userId: user.id };
    if (unreadOnly === 'true') where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } })
    ]);

    return res.status(200).json({
      success: true,
      data: { notifications, unreadCount, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ success: false, message: '获取通知失败' });
  }
}

async function handleDelete(req: VercelRequest, res: VercelResponse, id: string | string[] | undefined) {
  if (req.method !== 'DELETE') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ success: false, message: '未授权' });

  const notificationId = Array.isArray(id) ? id[0] : id;
  if (!notificationId) return res.status(400).json({ success: false, message: '缺少通知ID' });

  try {
    await prisma.notification.delete({ where: { id: notificationId } });
    return res.status(200).json({ success: true, message: '通知已删除' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ success: false, message: '删除失败' });
  }
}

async function handleRead(req: VercelRequest, res: VercelResponse, id: string | string[] | undefined) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ success: false, message: '未授权' });

  const notificationId = Array.isArray(id) ? id[0] : id;
  if (!notificationId) return res.status(400).json({ success: false, message: '缺少通知ID' });

  try {
    await prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
    return res.status(200).json({ success: true, message: '已标记为已读' });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ success: false, message: '操作失败' });
  }
}

async function handleReadAll(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ success: false, message: '未授权' });

  try {
    await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
    return res.status(200).json({ success: true, message: '已全部标记为已读' });
  } catch (error) {
    console.error('Mark all read error:', error);
    return res.status(500).json({ success: false, message: '操作失败' });
  }
}
