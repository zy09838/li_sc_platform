import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({
    success: true,
    message: 'Li-SC Platform API is running',
    timestamp: new Date().toISOString()
  });
}
