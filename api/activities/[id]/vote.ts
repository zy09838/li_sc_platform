import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuth } from '../../_lib/auth';
import { prisma } from '../../_lib/prisma';
import { setCorsHeaders } from '../../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const user = await verifyAuth(req);
  if (!user) {
    return res.status(401).json({ success: false, message: '未授权' });
  }

  const { id } = req.query;
  const activityId = Array.isArray(id) ? id[0] : id;

  if (!activityId) {
    return res.status(400).json({ success: false, message: '缺少活动ID' });
  }

  try {
    const { optionId } = req.body;

    const activity: any = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { votes: true }
    });

    if (!activity || !activity.votes || activity.votes.length === 0) {
      return res.status(404).json({ success: false, message: '投票不存在' });
    }

    const vote = activity.votes[0];

    const existing = await prisma.userVote.findUnique({
      where: { voteId_userId: { voteId: vote.id, userId: user.id } }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: '您已投过票' });
    }

    await prisma.userVote.create({
      data: { voteId: vote.id, userId: user.id, optionId: String(optionId) }
    });

    const options = vote.options as any[];
    const updatedOptions = options.map((opt: any) => {
      if (opt.id === optionId) {
        return { ...opt, count: (opt.count || 0) + 1 };
      }
      return opt;
    });

    await prisma.activityVote.update({
      where: { id: vote.id },
      data: { options: updatedOptions }
    });

    return res.status(200).json({ success: true, message: '投票成功' });
  } catch (error) {
    console.error('Vote error:', error);
    return res.status(500).json({ success: false, message: '投票失败' });
  }
}
