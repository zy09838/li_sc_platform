import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { setCorsHeaders } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { id } = req.query;
  const notificationId = Array.isArray(id) ? id[0] : id;

  if (!notificationId) {
    return res.status(400).json({ success: false, message: '缺少通知ID' });
  }

  try {
    await prisma.notification.delete({ where: { id: notificationId } });
    return res.status(200).json({ success: true, message: '通知已删除' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ success: false, message: '删除失败' });
  }
}
