import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from './_auth.js';
import { prisma } from './_prisma.js';
import { setCorsHeaders } from './_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  switch (action) {
    case 'list':
      return handleList(req, res);
    case 'categories':
      return handleCategories(req, res);
    case 'orders':
      return handleOrders(req, res);
    default:
      return res.status(400).json({ success: false, message: 'Invalid action' });
  }
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  try {
    const { category, page = '1', limit = '12' } = req.query;
    const where: any = { status: 'active' };
    if (category) where.category = category;
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy: [{ isHot: 'desc' }, { isNew: 'desc' }, { createdAt: 'desc' }], skip, take: Number(limit) }),
      prisma.product.count({ where })
    ]);

    return res.status(200).json({
      success: true,
      data: { products, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ success: false, message: '获取商品列表失败' });
  }
}

async function handleCategories(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  try {
    const categories = await prisma.product.groupBy({ by: ['category'], _count: { id: true }, where: { status: 'active', category: { not: null } } });
    return res.status(200).json({ success: true, data: categories.map(c => ({ name: c.category, count: c._count.id })) });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ success: false, message: '获取分类失败' });
  }
}

async function handleOrders(req: VercelRequest, res: VercelResponse) {
  const user = await verifyAuth(req);
  if (!user) return res.status(401).json({ success: false, message: '未授权' });

  if (req.method === 'GET') {
    try {
      const { page = '1', limit = '10' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [orders, total] = await Promise.all([
        prisma.order.findMany({ where: { userId: user.id }, include: { product: true }, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
        prisma.order.count({ where: { userId: user.id } })
      ]);

      return res.status(200).json({
        success: true,
        data: { orders, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }
      });
    } catch (error) {
      console.error('Get orders error:', error);
      return res.status(500).json({ success: false, message: '获取订单失败' });
    }
  } else if (req.method === 'POST') {
    try {
      const { productId } = req.body;
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return res.status(404).json({ success: false, message: '商品不存在' });
      if (product.stock <= 0) return res.status(400).json({ success: false, message: '商品库存不足' });

      const userData = await prisma.user.findUnique({ where: { id: user.id } });
      if (!userData || userData.points < product.price) return res.status(400).json({ success: false, message: '积分不足' });

      const [order] = await prisma.$transaction([
        prisma.order.create({ data: { userId: user.id, productId, pointsSpent: product.price, status: 'confirmed' } }),
        prisma.user.update({ where: { id: user.id }, data: { points: { decrement: product.price } } }),
        prisma.product.update({ where: { id: productId }, data: { stock: { decrement: 1 } } }),
        prisma.pointTransaction.create({ data: { userId: user.id, type: 'out', amount: product.price, reason: `兑换 ${product.name}`, relatedEntityType: 'order', relatedEntityId: productId } })
      ]);

      return res.status(201).json({ success: true, data: order, message: '兑换成功' });
    } catch (error) {
      console.error('Create order error:', error);
      return res.status(500).json({ success: false, message: '兑换失败' });
    }
  }
  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
