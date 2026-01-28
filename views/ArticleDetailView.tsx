
import React, { useState, useEffect } from 'react';
import { Article } from '../types';
import { CURRENT_USER } from '../constants';
import { ArrowLeft, ThumbsUp, MessageSquare, Share2, MoreHorizontal, Send, Calendar, Eye, Trash2, Check, Sparkles, CornerDownRight } from 'lucide-react';

interface ArticleDetailViewProps {
  article: Article;
  onBack: () => void;
  onLike?: (articleId: string, authorId: string) => void;
}

interface Comment {
  id: number;
  user: string;
  content: string;
  date: string;
  avatar: string;
  likes: number;
  isLiked: boolean;
  replies: Comment[];
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({ article, onBack, onLike }) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([
    { 
      id: 1, 
      user: '李思思', 
      content: '分析得很透彻，特别是关于新能源渗透率那部分，数据很详实。', 
      date: '1小时前', 
      avatar: 'https://picsum.photos/id/60/50/50',
      likes: 12,
      isLiked: false,
      replies: [] 
    },
    { 
      id: 2, 
      user: '张伟', 
      content: '期待明年的全球展望报告！到时候记得分享一下。', 
      date: '2小时前', 
      avatar: 'https://picsum.photos/id/61/50/50',
      likes: 5,
      isLiked: false,
      replies: [
        {
          id: 21,
          user: '黄予涵',
          content: '好的，报告出来第一时间发群里。',
          date: '1小时前',
          avatar: 'https://picsum.photos/id/65/50/50',
          likes: 2,
          isLiked: true,
          replies: []
        }
      ]
    }
  ]);
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likes);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  // Reply State
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const newComment: Comment = { 
      id: Date.now(), 
      user: CURRENT_USER.name, 
      content: commentText, 
      date: '刚刚', 
      avatar: CURRENT_USER.avatar,
      likes: 0,
      isLiked: false,
      replies: [] 
    };

    setComments([newComment, ...comments]);
    setCommentText('');
  };

  const handleSendReply = (parentId: number) => {
    if (!replyText.trim()) return;

    const newReply: Comment = {
      id: Date.now(),
      user: CURRENT_USER.name,
      content: replyText,
      date: '刚刚',
      avatar: CURRENT_USER.avatar,
      likes: 0,
      isLiked: false,
      replies: []
    };

    setComments(prev => prev.map(c => {
      if (c.id === parentId) {
        return { ...c, replies: [...c.replies, newReply] };
      }
      return c;
    }));

    setReplyingToId(null);
    setReplyText('');
  };

  const handleDeleteComment = (id: number) => {
    if (window.confirm('确定要删除这条评论吗？')) {
      setComments(comments.filter(c => c.id !== id));
    }
  };

  const handleCommentLike = (commentId: number, isReply: boolean = false, parentId?: number) => {
    setComments(prev => prev.map(c => {
      if (!isReply && c.id === commentId) {
        const newIsLiked = !c.isLiked;
        return { ...c, isLiked: newIsLiked, likes: c.likes + (newIsLiked ? 1 : -1) };
      }
      if (isReply && c.id === parentId) {
        return {
          ...c,
          replies: c.replies.map(r => {
            if (r.id === commentId) {
              const newIsLiked = !r.isLiked;
              return { ...r, isLiked: newIsLiked, likes: r.likes + (newIsLiked ? 1 : -1) };
            }
            return r;
          })
        };
      }
      return c;
    }));
  };

  const handleLikeClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    if (isLiked) {
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
      if (onLike) {
        onLike(article.id, article.author.id);
      }
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: article.title,
      text: article.summary,
      url: window.location.href,
    };

    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      } catch (err) {
        console.debug('Clipboard failed', err);
      }
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        await copyToClipboard();
      }
    } else {
      await copyToClipboard();
    }
  };

  const renderContent = (content?: string) => {
    if (!content) return <p className="text-gray-500 italic">暂无正文内容...</p>;

    const formatInline = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
      
      return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
           const match = part.match(/\[(.*?)\]\((.*?)\)/);
           if (match) {
             const [, label, url] = match;
             return (
               <a 
                 key={idx} 
                 href={url} 
                 className="text-teal-600 hover:text-teal-800 hover:underline font-medium break-all"
                 target="_blank"
                 rel="noopener noreferrer"
               >
                 {label}
               </a>
             );
           }
        }
        return part;
      });
    };

    return content.split('\n').map((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.length === 0) {
        return <div key={idx} className="h-4" />;
      }

      if (trimmed.startsWith('###')) {
        return (
          <h3 key={idx} className="text-xl font-bold text-gray-900 mt-8 mb-4 flex items-center gap-2">
             <span className="w-1.5 h-6 bg-teal-600 rounded-full inline-block shrink-0"></span>
             <span>{trimmed.replace(/^###\s*/, '')}</span>
          </h3>
        );
      }

      if (trimmed.startsWith('>')) {
        return (
          <div key={idx} className="bg-gray-50 border-l-4 border-teal-500 p-4 my-6 rounded-r-lg text-gray-600 italic leading-relaxed shadow-sm">
             {formatInline(trimmed.replace(/^>\s*/, ''))}
          </div>
        );
      }

      if (trimmed.startsWith('*')) {
         return (
           <div key={idx} className="flex items-start gap-3 mb-3 ml-2 group">
              <span className="text-teal-200 mt-2 text-[8px] group-hover:text-teal-500 transition-colors">●</span>
              <div className="text-gray-700 leading-relaxed flex-1">
                {formatInline(trimmed.replace(/^\*\s*/, ''))}
              </div>
           </div>
         );
      }

      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return (
          <p key={idx} className="font-bold text-gray-800 mt-6 mb-3 text-lg">
            {formatInline(trimmed)}
          </p>
        );
      }

      return (
        <p key={idx} className="mb-4 text-gray-700 leading-7 text-justify tracking-wide">
          {formatInline(line)}
        </p>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300 pb-12 relative">
      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2 text-sm backdrop-blur-sm animate-in fade-in zoom-in duration-200">
           <Check size={16} className="text-green-400" /> 链接已复制
        </div>
      )}

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 sticky top-24 z-10 bg-[#f5f7fa]/90 backdrop-blur-sm py-2 rounded-lg">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-teal-700 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-white hover:shadow-sm"
        >
          <ArrowLeft size={18} /> 返回列表
        </button>
        <div className="flex gap-2">
           <button 
             onClick={handleShare}
             className="p-2 text-gray-500 hover:bg-white hover:text-teal-700 rounded-full transition-all hover:shadow-sm"
             title="分享文章"
           >
             <Share2 size={18} />
           </button>
           <button className="p-2 text-gray-500 hover:bg-white hover:text-teal-700 rounded-full transition-all hover:shadow-sm">
             <MoreHorizontal size={18} />
           </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
         {/* Article Header */}
         <div className="p-8 border-b border-gray-50">
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map(tag => (
                <span key={tag} className="bg-teal-50 text-teal-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-teal-100">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              {article.title}
            </h1>
            
            {/* Author Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <img src={article.author.avatar || `https://picsum.photos/seed/${article.author.id}/100/100`} alt={article.author.name} className="w-10 h-10 rounded-full border border-gray-100" />
                 <div>
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-gray-800 text-sm">{article.author.name}</span>
                       <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{article.author.role || '作者'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                       <span className="flex items-center gap-1"><Calendar size={12} /> {article.date}</span>
                       <span className="flex items-center gap-1"><Eye size={12} /> {article.views} 阅读</span>
                    </div>
                 </div>
              </div>
              
              <button className="bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 text-xs px-4 py-1.5 rounded-full font-bold transition-colors">
                + 关注
              </button>
            </div>
         </div>

         {/* Article Body */}
         <div className="p-8 min-h-[300px]">
            {renderContent(article.content)}
         </div>

         {/* Bottom Actions */}
         <div className="p-8 border-t border-gray-50 bg-gray-50/30 flex items-center justify-center gap-16">
            <button 
              onClick={handleLikeClick}
              className={`flex flex-col items-center gap-2 group transition-all relative ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            >
               <div className={`p-4 rounded-full transition-all duration-300 relative ${
                 isLiked ? 'bg-red-50 shadow-inner' : 'bg-white shadow-sm border border-gray-100'
               } ${isAnimating ? 'scale-125' : 'group-hover:scale-110'}`}>
                  <ThumbsUp size={24} className={`${isLiked ? 'fill-current' : ''} transition-transform ${isAnimating ? 'animate-bounce' : ''}`} />
                  {isAnimating && (
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Sparkles size={40} className="text-red-400 animate-ping opacity-50" />
                    </div>
                  )}
               </div>
               <div className="flex items-center gap-1">
                 <span key={likeCount} className={`text-sm font-bold animate-in zoom-in slide-in-from-bottom-2 duration-300 ${isLiked ? 'text-red-600' : 'text-gray-600'}`}>
                   {likeCount}
                 </span>
                 <span className="text-xs font-medium text-gray-400">赞</span>
               </div>
            </button>
            <button 
              onClick={handleShare}
              className="flex flex-col items-center gap-2 group text-gray-500 hover:text-blue-500 transition-all"
            >
               <div className="p-4 rounded-full bg-white shadow-sm group-hover:shadow-md border border-gray-100 transition-all duration-300 group-hover:scale-110">
                  <Share2 size={24} />
               </div>
               <span className="text-xs font-medium">分享</span>
            </button>
         </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="font-bold text-gray-800 mb-8 flex items-center gap-2 text-lg">
             <MessageSquare size={20} className="text-teal-600" /> 
             全部评论 
             <span className="text-gray-400 text-sm font-normal ml-1">({comments.reduce((acc, c) => acc + 1 + c.replies.length, 0)})</span>
          </h3>

          {/* Comment Input */}
          <div className="flex gap-4 mb-10">
             <img src={CURRENT_USER.avatar} className="w-10 h-10 rounded-full border border-gray-200 shadow-sm" alt="Me" />
             <div className="flex-1">
               <form onSubmit={handleSendComment} className="relative group">
                 <textarea 
                   value={commentText}
                   onChange={(e) => setCommentText(e.target.value)}
                   placeholder="写下你的真知灼见..." 
                   rows={3}
                   className="w-full bg-gray-50 border border-transparent rounded-xl p-4 text-sm focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all resize-none placeholder-gray-400"
                 />
                 <button 
                    type="submit"
                    disabled={!commentText.trim()}
                    className="absolute bottom-3 right-3 bg-teal-700 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-800 transition-all shadow-sm active:scale-95"
                 >
                    <Send size={16} />
                 </button>
               </form>
             </div>
          </div>

          {/* Comments List */}
          <div className="space-y-8">
             {comments.length === 0 ? (
               <div className="text-center py-8 text-gray-400 text-sm">暂无评论，快来抢沙发吧~</div>
             ) : (
               comments.map(comment => (
                 <div key={comment.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex gap-4">
                        <img src={comment.avatar} alt={comment.user} className="w-10 h-10 rounded-full border border-gray-100 shadow-sm" />
                        <div className="flex-1">
                           <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none hover:bg-gray-100 transition-colors border border-transparent hover:border-teal-100/30">
                              <div className="flex justify-between items-center mb-2">
                                 <span className="text-sm font-bold text-gray-800">{comment.user}</span>
                                 <span className="text-xs text-gray-400">{comment.date}</span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                           </div>
                           <div className="flex gap-4 mt-2 pl-2 items-center">
                              <button 
                                onClick={() => {
                                  setReplyingToId(comment.id);
                                  setReplyText('');
                                }}
                                className="text-xs text-gray-400 hover:text-teal-600 font-medium transition-colors"
                              >
                                回复
                              </button>
                              <button 
                                onClick={() => handleCommentLike(comment.id)}
                                className={`text-xs font-medium flex items-center gap-1 transition-all px-2 py-0.5 rounded-full ${comment.isLiked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50/50'}`}
                              >
                                 <ThumbsUp size={12} className={comment.isLiked ? 'fill-current' : ''} /> 
                                 {comment.likes > 0 ? comment.likes : '赞'}
                              </button>
                              {comment.user === CURRENT_USER.name && (
                                <button 
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-xs text-gray-300 hover:text-red-500 font-medium flex items-center gap-1 transition-colors ml-auto"
                                >
                                   <Trash2 size={12} /> 删除
                                </button>
                              )}
                           </div>

                           {/* Reply Input Form */}
                           {replyingToId === comment.id && (
                              <div className="mt-4 flex gap-3 animate-in fade-in zoom-in-95 duration-200 bg-teal-50/30 p-4 rounded-xl border border-teal-50">
                                 <img src={CURRENT_USER.avatar} className="w-8 h-8 rounded-full border border-gray-100 shadow-sm" alt="Me" />
                                 <div className="flex-1">
                                    <textarea
                                       value={replyText}
                                       onChange={(e) => setReplyText(e.target.value)}
                                       className="w-full bg-white border border-teal-100 rounded-lg p-3 text-xs focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none resize-none shadow-sm"
                                       placeholder={`回复 @${comment.user}...`}
                                       rows={2}
                                       autoFocus
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                       <button 
                                         onClick={() => setReplyingToId(null)} 
                                         className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                                       >
                                         取消
                                       </button>
                                       <button 
                                         onClick={() => handleSendReply(comment.id)} 
                                         disabled={!replyText.trim()}
                                         className="px-4 py-1.5 bg-teal-700 text-white text-xs rounded-md hover:bg-teal-800 disabled:opacity-50 transition-all font-bold shadow-sm"
                                       >
                                         发送回复
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           )}

                           {/* Nested Replies */}
                           {comment.replies.length > 0 && (
                             <div className="mt-4 space-y-4 pl-6 border-l-2 border-teal-50/50">
                               {comment.replies.map(reply => (
                                 <div key={reply.id} className="flex gap-3 animate-in fade-in slide-in-from-top-1 duration-300 group/reply">
                                    <div className="flex flex-col items-center">
                                       <img src={reply.avatar} alt={reply.user} className="w-8 h-8 rounded-full border border-gray-100 shadow-sm" />
                                       <div className="flex-1 w-px bg-teal-50/30 mt-2"></div>
                                    </div>
                                    <div className="flex-1">
                                       <div className="bg-teal-50/20 p-3 rounded-xl rounded-tl-none border border-transparent hover:border-teal-100/50 transition-all">
                                          <div className="flex justify-between items-center mb-1">
                                             <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-700">{reply.user}</span>
                                                <CornerDownRight size={10} className="text-teal-300" />
                                             </div>
                                             <span className="text-[10px] text-gray-400 font-medium">{reply.date}</span>
                                          </div>
                                          <p className="text-xs text-gray-600 leading-relaxed">{reply.content}</p>
                                       </div>
                                       <div className="flex gap-4 mt-1.5 pl-1 items-center">
                                          <button 
                                            onClick={() => handleCommentLike(reply.id, true, comment.id)}
                                            className={`text-[10px] font-bold flex items-center gap-1 transition-all px-2 py-0.5 rounded-full ${reply.isLiked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50/50'}`}
                                          >
                                             <ThumbsUp size={10} className={reply.isLiked ? 'fill-current' : ''} /> 
                                             {reply.likes > 0 ? reply.likes : '赞'}
                                          </button>
                                          <button className="text-[10px] text-gray-300 hover:text-teal-600 font-medium transition-colors">回复</button>
                                       </div>
                                    </div>
                                 </div>
                               ))}
                             </div>
                           )}
                        </div>
                    </div>
                 </div>
               ))
             )}
          </div>
      </div>
    </div>
  );
}
