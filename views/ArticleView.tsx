import React, { useState, useEffect } from 'react';
import { MOCK_ARTICLES, CURRENT_USER } from '../constants';
import { Eye, ThumbsUp, MessageSquare, Filter, PenTool, X, Pin, BadgeCheck } from 'lucide-react';
import { Article } from '../types';

interface ArticleViewProps {
  onArticleLike?: (authorId: string) => void;
  onArticleClick?: (article: Article) => void;
  triggerCreate?: boolean;
}

export const ArticleView: React.FC<ArticleViewProps> = ({ onArticleLike, onArticleClick, triggerCreate }) => {
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [filter, setFilter] = useState('全部');
  const [activeTab, setActiveTab] = useState('综合排序');
  const [likedArticles, setLikedArticles] = useState<Set<string>>(new Set());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newArticle, setNewArticle] = useState({
    title: '',
    category: '供应链发文',
    summary: '',
    content: ''
  });

  // Watch for external trigger to open modal
  useEffect(() => {
    if (triggerCreate) {
      setIsModalOpen(true);
    }
  }, [triggerCreate]);

  const filters = ['全部', '领导讲话', '行业动态', '内部公告', '公司精神', '供应链发文', '复盘专栏', '百家争鸣'];
  const tabs = ['综合排序', '最新发布', '最多浏览', '最多点赞'];

  const filteredArticles = articles.filter(article => {
    if (filter === '全部') return true;
    return article.category === filter;
  });

  // Sort articles: Pinned articles first, then by active tab criteria
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    // 1. Priority to pinned articles
    if (a.isTop && !b.isTop) return -1;
    if (!a.isTop && b.isTop) return 1;

    // 2. Sort based on activeTab
    if (activeTab === '最多浏览') {
      return b.views - a.views;
    }
    if (activeTab === '最多点赞') {
      return b.likes - a.likes;
    }
    // Default / Latest (Assumes array order or we could parse dates here)
    return 0;
  });

  const handleLike = (articleId: string, authorId: string) => {
    if (likedArticles.has(articleId)) return; // Prevent double like

    setArticles(prevArticles => prevArticles.map(a => {
      if (a.id === articleId) {
        return { ...a, likes: a.likes + 1 };
      }
      return a;
    }));
    
    setLikedArticles(prev => new Set(prev).add(articleId));

    if (onArticleLike) {
      onArticleLike(authorId);
    }
  };

  const handlePin = (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation();
    setArticles(prevArticles => prevArticles.map(a => {
      if (a.id === articleId) {
        return { ...a, isTop: !a.isTop };
      }
      return a;
    }));
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.title || !newArticle.summary) return;

    const article: Article = {
      id: Date.now().toString(),
      title: newArticle.title,
      summary: newArticle.summary,
      content: newArticle.content,
      author: CURRENT_USER,
      date: '刚刚',
      tags: [newArticle.category],
      category: newArticle.category,
      views: 0,
      likes: 0,
      comments: 0,
      isNew: true
    };

    setArticles([article, ...articles]);
    setIsModalOpen(false);
    setNewArticle({ title: '', category: '供应链发文', summary: '', content: '' });
  };

  return (
    <div className="space-y-6 relative">
      {/* Header & Search */}
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">发文专区</h2>
           <p className="text-gray-500 text-sm mt-1">汇聚供应链智慧，分享前沿见解</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-700 text-white px-4 py-2 rounded shadow-sm hover:bg-teal-800 flex items-center gap-2 transition-colors"
        >
           <PenTool size={16} /> 写文章
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100">
           <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-gray-400 text-sm py-1 mr-2 flex items-center gap-1"><Filter size={14}/> 分类:</span>
              {filters.map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)} 
                  className={`text-sm px-3 py-1 rounded-full transition-colors ${
                    filter === f 
                    ? 'bg-teal-50 text-teal-700 font-bold' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {f}
                </button>
              ))}
           </div>
           <div className="flex gap-6 text-sm">
             {tabs.map(tab => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`pb-2 border-b-2 transition-colors ${
                   activeTab === tab 
                     ? 'border-teal-600 text-teal-800 font-bold' 
                     : 'border-transparent text-gray-500 hover:text-gray-700'
                 }`}
               >
                 {tab}
               </button>
             ))}
           </div>
        </div>

        {/* Article List */}
        <div className="divide-y divide-gray-100">
          {sortedArticles.length === 0 ? (
            <div className="p-12 text-center text-gray-400">暂无该分类的文章</div>
          ) : (
            sortedArticles.map(article => (
              <div 
                key={article.id} 
                className={`p-6 hover:bg-gray-50/80 transition-all flex gap-6 group cursor-pointer animate-in fade-in duration-300 border-l-4 ${article.isTop ? 'bg-blue-50/30 border-blue-500' : 'border-transparent'}`}
                onClick={() => onArticleClick && onArticleClick(article)}
              >
                <div className="flex-1 flex flex-col">
                  {/* Tags & Meta Row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                      {article.isTop && (
                         <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm">
                            <Pin size={10} className="fill-white"/> 置顶
                         </span>
                      )}
                      {article.isOfficial && (
                         <span className="bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                            <BadgeCheck size={10} /> 官方
                         </span>
                      )}
                      {article.isNew && (
                         <span className="bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
                            NEW
                         </span>
                      )}
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium border border-gray-200">
                        {article.category}
                      </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-teal-700 transition-colors leading-snug">
                      {article.title}
                  </h3>
                  
                  {/* Summary */}
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">
                      {article.summary}
                  </p>
                  
                  {/* Footer Meta */}
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto">
                      <div className="flex items-center gap-2">
                         <img 
                           src={article.author.avatar || `https://picsum.photos/seed/${article.author.id}/24/24`} 
                           alt={article.author.name} 
                           className="w-5 h-5 rounded-full border border-gray-200"
                         />
                         <span className="text-gray-700 font-medium">{article.author.name}</span>
                      </div>
                      <span className="w-px h-3 bg-gray-300 mx-1"></span>
                      <span>{article.date}</span>
                      <span className="w-px h-3 bg-gray-300 mx-1"></span>
                      <span className="flex items-center gap-1"><Eye size={12} /> {article.views}</span>
                      
                      {/* Action Buttons (Right Aligned) */}
                      <div className="flex items-center gap-4 ml-auto">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(article.id, article.author.id);
                          }}
                          className={`flex items-center gap-1 transition-colors hover:text-red-500 group-hover/btn:scale-110 ${likedArticles.has(article.id) ? 'text-red-500 font-bold' : ''}`}
                          title="点赞"
                        >
                           <ThumbsUp size={14} className={likedArticles.has(article.id) ? "fill-red-500" : ""} /> {article.likes}
                        </button>
                        
                        <button 
                          onClick={(e) => handlePin(e, article.id)}
                          className={`flex items-center gap-1 transition-colors hover:text-blue-600 ${article.isTop ? 'text-blue-600 font-bold' : ''}`}
                          title={article.isTop ? "取消置顶" : "置顶"}
                        >
                          <Pin size={14} className={article.isTop ? "fill-blue-600" : ""} /> {article.isTop ? '已置顶' : '置顶'}
                        </button>
                      </div>
                  </div>
                </div>
                
                {article.imageUrl && (
                  <div className="w-48 h-32 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                    <img src={article.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="thumbnail" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Write Article Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative animate-in fade-in zoom-in duration-200 shadow-2xl h-[80vh] flex flex-col">
             <button 
               onClick={() => setIsModalOpen(false)} 
               className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
             >
               <X size={20} />
             </button>
             <h3 className="text-xl font-bold mb-6 text-gray-800">撰写新文章</h3>
             
             <form onSubmit={handlePublish} className="space-y-4 flex-1 flex flex-col">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                 <input 
                   type="text" 
                   value={newArticle.title}
                   onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                   placeholder="请输入文章标题" 
                   className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none font-bold"
                   required
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                 <select 
                   value={newArticle.category}
                   onChange={(e) => setNewArticle({...newArticle, category: e.target.value})}
                   className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                 >
                   {filters.filter(f => f !== '全部').map(f => (
                     <option key={f} value={f}>{f}</option>
                   ))}
                 </select>
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
                 <textarea 
                   rows={2}
                   value={newArticle.summary}
                   onChange={(e) => setNewArticle({...newArticle, summary: e.target.value})}
                   placeholder="请输入文章摘要..." 
                   className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
                   required
                 />
               </div>
               
               <div className="flex-1 flex flex-col">
                 <label className="block text-sm font-medium text-gray-700 mb-1">正文</label>
                 <textarea 
                   value={newArticle.content}
                   onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
                   placeholder="开始创作..." 
                   className="w-full flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
                 />
               </div>

               <div className="pt-2 flex justify-end gap-3">
                 <button 
                   type="button"
                   onClick={() => setIsModalOpen(false)}
                   className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                 >
                   取消
                 </button>
                 <button 
                   type="submit"
                   className="px-6 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors shadow-sm"
                 >
                   发布文章
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};