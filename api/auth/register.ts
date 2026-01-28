import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../_lib/prisma';
import { setCorsHeaders } from '../_lib/cors';

const JWT_OPTIONS: SignOptions = {
  expiresIn: '7d'
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { employeeId, name, email, password, department } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeId },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '工号或邮箱已被注册'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        employeeId,
        name,
        email,
        password: hashedPassword,
        department,
        avatarUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/100/100`
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        avatarUrl: true,
        department: true,
        role: true,
        points: true,
        createdAt: true
      }
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      JWT_OPTIONS
    );

    return res.status(201).json({
      success: true,
      data: { user, token }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: '注册失败' });
  }
}
