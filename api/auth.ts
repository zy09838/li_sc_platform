import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SignOptions } from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  switch (action) {
    case 'register':
      return handleRegister(req, res);
    case 'login':
      return handleLogin(req, res);
    case 'logout':
      return handleLogout(req, res);
    case 'me':
      return handleMe(req, res);
    default:
      return res.status(400).json({ success: false, message: 'Invalid action' });
  }
}

async function handleRegister(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const bcrypt = await import('bcryptjs');
    const jwt = await import('jsonwebtoken');
    
    const prisma = new PrismaClient();
    const { employeeId, name, email, password, department } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ employeeId }, { email }] }
    });

    if (existingUser) {
      await prisma.$disconnect();
      return res.status(400).json({ success: false, message: '工号或邮箱已被注册' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        employeeId, name, email, password: hashedPassword, department,
        avatarUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/100/100`
      },
      select: { id: true, employeeId: true, name: true, email: true, avatarUrl: true, department: true, role: true, points: true, createdAt: true }
    });

    const JWT_OPTIONS: SignOptions = { expiresIn: '7d' };
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, JWT_OPTIONS);
    
    await prisma.$disconnect();
    return res.status(201).json({ success: true, data: { user, token } });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: '注册失败: ' + error.message });
  }
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const bcrypt = await import('bcryptjs');
    const jwt = await import('jsonwebtoken');
    
    const prisma = new PrismaClient();
    const { employeeId, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { employeeId } });

    if (!user) {
      await prisma.$disconnect();
      return res.status(401).json({ success: false, message: '工号或密码错误' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await prisma.$disconnect();
      return res.status(401).json({ success: false, message: '工号或密码错误' });
    }

    const JWT_OPTIONS: SignOptions = { expiresIn: '7d' };
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, JWT_OPTIONS);
    const { password: _, ...userWithoutPassword } = user;

    await prisma.$disconnect();
    return res.status(200).json({ success: true, data: { user: userWithoutPassword, token } });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: '登录失败: ' + error.message });
  }
}

async function handleLogout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { verifyAuth } = await import('./_lib/auth');
  const user = await verifyAuth(req);
  
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  return res.status(200).json({ success: true, message: '登出成功' });
}

async function handleMe(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { verifyAuth } = await import('./_lib/auth');
  const authUser = await verifyAuth(req);
  
  if (!authUser) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true, employeeId: true, name: true, email: true, avatarUrl: true, department: true, role: true, points: true, createdAt: true,
        _count: { select: { articles: true, comments: true, articleLikes: true } }
      }
    });

    await prisma.$disconnect();
    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    console.error('Get me error:', error);
    return res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
}
