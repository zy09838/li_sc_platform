import { VercelRequest } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

export interface AuthUser {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  role: string;
}

export async function verifyAuth(req: VercelRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, employeeId: true, name: true, email: true, role: true }
    });
    return user;
  } catch {
    return null;
  }
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin' || user?.role === 'super_admin';
}
