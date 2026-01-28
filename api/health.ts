import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './_lib/cors';
import { prisma } from './_lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  let dbStatus = 'unknown';
  let dbError = null;
  let userCount = 0;

  try {
    // Test database connection
    userCount = await prisma.user.count();
    dbStatus = 'connected';
  } catch (error: any) {
    dbStatus = 'error';
    dbError = error.message;
  }

  return res.status(200).json({
    success: true,
    message: 'Li-SC Platform API is running',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      userCount,
      error: dbError
    },
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET
    }
  });
}
