import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Eye, Heart, MessageSquare, Clock, ChevronDown, Plus, Pin, Loader2, X } from 'lucide-react';
import { articlesApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { SkeletonList } from '../components/Loading';

interface Article {
  id: string;
  title: string;
  summary: string;
  content?: string;
  category: string;
  tags?: string[];
  imageUrl?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    department?: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const ArticleView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest');
  
  // Create form
  const [createForm, setCreateForm] = useState({
    title: '',
    summary: '',
    content: '',
    category: '',
    tags: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadArticles(1);
  }, [selectedCategory, sortBy]);

  const loadCategories = async () => {
    try {
      const response: any = await articlesApi.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Load categories failed:', error);
    }
  };

  const loadArticles = async (page: number) => {
    setLoading(true);
    try {
      const response: any = await articlesApi.list({
        page,
        limit: 10,
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
        sort: sortBy
      });
      if (response.success) {
        setArticles(response.data.articles);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Load articles failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadArticles(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchParams(prev => {
      if (category) {
        prev.set('category', category);
      } else {
        prev.delete('category');
      }
      return prev;
    });
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.content.trim() || !createForm.category) {
      return;
    }
    
    setCreating(true);
    try {
      const response: any = await articlesApi.create({
        title: createForm.title.trim(),
        summary: createForm.summary.trim() || createForm.content.slice(0, 100),
        content: createForm.content.trim(),
        category: createForm.category,
        tags: createForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      if (response.success) {
        setShowCreateModal(false);
        setCreateForm({ title: '', summary: '', content: '', category: '', tags: '' });
        loadArticles(1);
        navigate(`/articles/${response.data.id}`);
      }
    } catch (error) {
      console.error('Create article failed:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">发文专区</h1>
          <p className="text-sm text-gray-500 mt-1">分享知识，交流经验</p>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> 发布文章
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文章..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </form>
          
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            >
              <option value="">全部分类</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          >
            <option value="latest">最新发布</option>
            <option value="hot">最多阅读</option>
            <option value="liked">最多点赞</option>
          </select>
        </div>
      </div>

      {/* Article List */}
      {loading ? (
        <SkeletonList count={5} />
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
          <p className="text-gray-400">暂无文章</p>
          {isAuthenticated && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-teal-600 hover:text-teal-700 text-sm"
            >
              发布第一篇文章
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map(article => (
            <Link
              key={article.id}
              to={`/articles/${article.id}`}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all block group"
            >
              <div className="flex gap-4">
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-32 h-24 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-teal-50 text-teal-600 px-2 py-0.5 rounded text-xs">{article.category}</span>
                    {article.isPinned && (
                      <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                        <Pin size={10} /> 置顶
                      </span>
                    )}
                  </div>
                  <h2 className="font-bold text-gray-800 line-clamp-1 group-hover:text-teal-600 transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{article.summary}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={article.author.avatarUrl || `https://picsum.photos/seed/${article.author.id}/24/24`}
                        alt={article.author.name}
                        className="w-5 h-5 rounded-full border border-gray-100"
                      />
                      <span className="text-xs text-gray-500">{article.author.name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Eye size={12} /> {article.viewCount}</span>
                      <span className="flex items-center gap-1"><Heart size={12} /> {article.likeCount}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={12} /> {article.commentCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => loadArticles(i + 1)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                pagination.page === i + 1
                  ? 'bg-teal-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-teal-700 p-6 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Plus size={20} /> 发布文章
              </h3>
              <button onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateArticle} className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="文章标题"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
                    required
                  >
                    <option value="">请选择分类</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="其他">其他</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
                  <textarea
                    value={createForm.summary}
                    onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })}
                    placeholder="文章摘要（可选，不填则自动截取正文前100字）"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm resize-none"
                    rows={2}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">正文 *</label>
                  <textarea
                    value={createForm.content}
                    onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                    placeholder="文章正文内容..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm resize-none"
                    rows={10}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
                  <input
                    type="text"
                    value={createForm.tags}
                    onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                    placeholder="标签，用逗号分隔（如：供应链,最佳实践）"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={creating || !createForm.title.trim() || !createForm.content.trim() || !createForm.category}
                  className="flex-1 bg-teal-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="animate-spin" size={18} /> : null}
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
