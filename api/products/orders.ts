import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../_lib/auth';
import { prisma } from '../_lib/prisma';
import { setCorsHeaders } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  if (req.method === 'GET') {
    return handleGet(user.id, req, res);
  } else if (req.method === 'POST') {
    return handlePost(user.id, req, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function handleGet(userId: string, req: VercelRequest, res: VercelResponse) {
  try {
    const { page = '1', limit = '10' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.order.count({ where: { userId } })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ success: false, message: '获取订单失败' });
  }
}

async function handlePost(userId: string, req: VercelRequest, res: VercelResponse) {
  try {
    const { productId } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ success: false, message: '商品库存不足' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.points < product.price) {
      return res.status(400).json({ success: false, message: '积分不足' });
    }

    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          userId,
          productId,
          pointsSpent: product.price,
          status: 'confirmed'
        }
      }),
      prisma.user.update({
        where: { id: userId },
        data: { points: { decrement: product.price } }
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stock: { decrement: 1 } }
      }),
      prisma.pointTransaction.create({
        data: {
          userId,
          type: 'out',
          amount: product.price,
          reason: `兑换 ${product.name}`,
          relatedEntityType: 'order',
          relatedEntityId: productId
        }
      })
    ]);

    return res.status(201).json({ success: true, data: order, message: '兑换成功' });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ success: false, message: '兑换失败' });
  }
}
