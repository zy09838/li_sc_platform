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
  const articleId = Array.isArray(id) ? id[0] : id;

  if (!articleId) {
    return res.status(400).json({ success: false, message: '缺少文章ID' });
  }

  try {
    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      return res.status(404).json({ success: false, message: '文章不存在' });
    }

    const existingLike = await prisma.articleLike.findUnique({
      where: { articleId_userId: { articleId, userId: user.id } }
    });

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.articleLike.delete({
          where: { id: existingLike.id }
        }),
        prisma.article.update({
          where: { id: articleId },
          data: { likes: { decrement: 1 } }
        })
      ]);

      return res.status(200).json({ success: true, data: { liked: false } });
    }

    // Like
    await prisma.$transaction([
      prisma.articleLike.create({
        data: { articleId, userId: user.id }
      }),
      prisma.article.update({
        where: { id: articleId },
        data: { likes: { increment: 1 } }
      }),
      prisma.notification.create({
        data: {
          userId: article.authorId,
          type: 'like',
          title: '收到新的点赞',
          content: `${user.name} 点赞了你的文章《${article.title}》`,
          link: `/articles/${articleId}`
        }
      })
    ]);

    return res.status(200).json({ success: true, data: { liked: true } });
  } catch (error) {
    console.error('Like article error:', error);
    return res.status(500).json({ success: false, message: '操作失败' });
  }
}
