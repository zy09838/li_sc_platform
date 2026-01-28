import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageSquare, Bookmark, Share2, Send, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { articlesApi, commentsApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Loading } from '../components/Loading';

interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
  department?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
  replies?: Comment[];
}

interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags?: string[];
  imageUrl?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned: boolean;
  isLiked: boolean;
  createdAt: string;
  author: Author;
}

export const ArticleDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadArticle();
      loadComments();
    }
  }, [id]);

  const loadArticle = async () => {
    try {
      const response: any = await articlesApi.getDetail(id!);
      if (response.success) {
        setArticle(response.data);
      }
    } catch (err: any) {
      setError(err?.message || '加载文章失败');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response: any = await commentsApi.list(id!, 1, 50);
      if (response.success) {
        setComments(response.data.comments);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    setLiking(true);
    try {
      const response: any = await articlesApi.like(id!);
      if (response.success) {
        setArticle(prev => prev ? {
          ...prev,
          isLiked: !prev.isLiked,
          likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1
        } : null);
      }
    } catch (err: any) {
      console.error('Like failed:', err);
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) {
      if (!isAuthenticated) navigate('/login');
      return;
    }
    
    setCommenting(true);
    try {
      const response: any = await commentsApi.create({
        articleId: id!,
        content: commentText.trim()
      });
      if (response.success) {
        setComments(prev => [response.data, ...prev]);
        setCommentText('');
        setArticle(prev => prev ? {
          ...prev,
          commentCount: prev.commentCount + 1
        } : null);
      }
    } catch (err: any) {
      setError(err?.message || '评论失败');
    } finally {
      setCommenting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response: any = await commentsApi.delete(commentId);
      if (response.success) {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setArticle(prev => prev ? {
          ...prev,
          commentCount: prev.commentCount - 1
        } : null);
      }
    } catch (err) {
      console.error('Delete comment failed:', err);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">文章不存在或已删除</p>
        <button onClick={() => navigate('/articles')} className="mt-4 text-teal-600 hover:underline">
          返回文章列表
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/articles')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={18} /> 返回文章列表
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Article Content */}
      <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {article.imageUrl && (
          <div className="h-72 bg-gray-100">
            <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="p-6 lg:p-8">
          {/* Category & Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded text-xs font-medium">
              {article.category}
            </span>
            {article.tags?.map(tag => (
              <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                #{tag}
              </span>
            ))}
            {article.isPinned && (
              <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs">置顶</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>

          {/* Author Info */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <img
                src={article.author.avatarUrl || `https://picsum.photos/seed/${article.author.id}/48/48`}
                alt={article.author.name}
                className="w-10 h-10 rounded-full border border-gray-100"
              />
              <div>
                <p className="font-medium text-gray-900">{article.author.name}</p>
                <p className="text-xs text-gray-500">
                  {article.author.department} · {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{article.viewCount} 阅读</span>
              <span>{article.likeCount} 点赞</span>
              <span>{article.commentCount} 评论</span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm lg:prose-base max-w-none text-gray-700 mb-6">
            <p className="text-gray-500 italic mb-4">{article.summary}</p>
            <div className="whitespace-pre-wrap">{article.content}</div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                article.isLiked
                  ? 'bg-red-50 text-red-600'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Heart size={18} fill={article.isLiked ? 'currentColor' : 'none'} />
              <span>{article.likeCount}</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
              <Bookmark size={18} />
              <span>收藏</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
              <Share2 size={18} />
              <span>分享</span>
            </button>
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6 p-6">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MessageSquare size={18} className="text-teal-600" />
          评论 ({comments.length})
        </h3>

        {/* Comment Form */}
        {isAuthenticated ? (
          <form onSubmit={handleComment} className="mb-6">
            <div className="flex gap-3">
              <img
                src={user?.avatarUrl || `https://picsum.photos/seed/${user?.id}/40/40`}
                alt={user?.name}
                className="w-10 h-10 rounded-full border border-gray-100 shrink-0"
              />
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="写下你的评论..."
                  className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!commentText.trim() || commenting}
                    className="bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {commenting ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Send size={16} />
                    )}
                    发表评论
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
            <p className="text-gray-500 text-sm">
              <Link to="/login" className="text-teal-600 font-medium hover:underline">登录</Link>
              后参与评论
            </p>
          </div>
        )}

        {/* Comment List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-gray-400 py-8">暂无评论，快来发表第一条评论吧</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-3 group">
                <img
                  src={comment.author.avatarUrl || `https://picsum.photos/seed/${comment.author.id}/40/40`}
                  alt={comment.author.name}
                  className="w-10 h-10 rounded-full border border-gray-100 shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{comment.author.name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    {user?.id === comment.author.id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
