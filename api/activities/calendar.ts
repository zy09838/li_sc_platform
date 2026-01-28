import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';
import { setCorsHeaders } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { month, year } = req.query;

    const currentYear = year ? Number(year) : new Date().getFullYear();
    const currentMonth = month ? Number(month) - 1 : new Date().getMonth();

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    const activities = await prisma.activity.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        title: true,
        date: true,
        status: true
      }
    });

    const calendarData: Record<string, any[]> = {};
    activities.forEach((a: any) => {
      const dateKey = a.date.toISOString().split('T')[0];
      if (!calendarData[dateKey]) {
        calendarData[dateKey] = [];
      }
      calendarData[dateKey].push(a);
    });

    return res.status(200).json({ success: true, data: calendarData });
  } catch (error) {
    console.error('Get calendar error:', error);
    return res.status(500).json({ success: false, message: '获取日历数据失败' });
  }
}
