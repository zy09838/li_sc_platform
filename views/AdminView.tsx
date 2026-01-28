import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, FileText, Calendar, Gift, Bell, Settings, BarChart2, 
  TrendingUp, Eye, Heart, MessageSquare, Clock, Search, Filter,
  Plus, Edit2, Trash2, ChevronDown, Loader2, CheckCircle, X
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { articlesApi, activitiesApi, productsApi, usersApi } from '../services/api';
import { SkeletonTable } from '../components/Loading';

type AdminTab = 'overview' | 'articles' | 'activities' | 'products' | 'users';

export const AdminView: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalArticles: 0,
    totalActivities: 0,
    totalProducts: 0,
    todayViews: 0,
    todayLikes: 0
  });
  
  // Data lists
  const [articles, setArticles] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadAdminData();
  }, [isAuthenticated, activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'overview':
          // Load stats and leaderboard
          const leaderboardRes: any = await usersApi.getLeaderboard(10);
          if (leaderboardRes.success) {
            setLeaderboard(leaderboardRes.data);
          }
          // Mock stats - in real app, would have a dedicated stats API
          setStats({
            totalUsers: 156,
            totalArticles: 89,
            totalActivities: 24,
            totalProducts: 45,
            todayViews: 1234,
            todayLikes: 89
          });
          break;
        case 'articles':
          const articlesRes: any = await articlesApi.list({ limit: 20 });
          if (articlesRes.success) {
            setArticles(articlesRes.data.articles);
          }
          break;
        case 'activities':
          const activitiesRes: any = await activitiesApi.list({ limit: 20 });
          if (activitiesRes.success) {
            setActivities(activitiesRes.data.activities);
          }
          break;
        case 'products':
          const productsRes: any = await productsApi.list({ limit: 20 });
          if (productsRes.success) {
            setProducts(productsRes.data.products);
          }
          break;
      }
    } catch (error) {
      console.error('Load admin data failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePinArticle = async (articleId: string) => {
    try {
      await articlesApi.pin(articleId);
      setArticles(prev => prev.map(a => 
        a.id === articleId ? { ...a, isPinned: !a.isPinned } : a
      ));
    } catch (error) {
      console.error('Pin article failed:', error);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return;
    try {
      await articlesApi.delete(articleId);
      setArticles(prev => prev.filter(a => a.id !== articleId));
    } catch (error) {
      console.error('Delete article failed:', error);
    }
  };

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '数据概览', icon: <BarChart2 size={18} /> },
    { id: 'articles', label: '文章管理', icon: <FileText size={18} /> },
    { id: 'activities', label: '活动管理', icon: <Calendar size={18} /> },
    { id: 'products', label: '商品管理', icon: <Gift size={18} /> },
    { id: 'users', label: '用户管理', icon: <Users size={18} /> },
  ];

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">管理后台</h1>
        <p className="text-sm text-gray-500 mt-1">平台数据和内容管理</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-teal-50 text-teal-700 border-l-2 border-teal-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <SkeletonTable rows={6} cols={5} />
          ) : activeTab === 'overview' ? (
            /* Overview */
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
                      <p className="text-xs text-gray-500">总用户数</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{stats.totalArticles}</p>
                      <p className="text-xs text-gray-500">文章总数</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Eye size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{stats.todayViews}</p>
                      <p className="text-xs text-gray-500">今日浏览</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Heart size={20} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{stats.todayLikes}</p>
                      <p className="text-xs text-gray-500">今日点赞</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leaderboard */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-teal-600" /> 用户积分排行
                </h3>
                <div className="space-y-3">
                  {leaderboard.map((u, index) => (
                    <div key={u.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded-full ${
                        index === 0 ? 'bg-yellow-500 text-white' : 
                        index === 1 ? 'bg-gray-400 text-white' : 
                        index === 2 ? 'bg-orange-700 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <img 
                        src={u.avatarUrl || `https://picsum.photos/seed/${u.id}/40/40`} 
                        alt={u.name}
                        className="w-10 h-10 rounded-full border border-gray-200"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.department || '未知部门'}</p>
                      </div>
                      <span className="text-teal-600 font-bold">{u.points} 分</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'articles' ? (
            /* Articles Management */
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">文章列表</h3>
                <button className="bg-teal-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors flex items-center gap-1">
                  <Plus size={16} /> 新建文章
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">标题</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">作者</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">分类</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">数据</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">状态</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {articles.map(article => (
                      <tr key={article.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 text-sm line-clamp-1">{article.title}</p>
                          <p className="text-xs text-gray-400">{new Date(article.createdAt).toLocaleDateString('zh-CN')}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <img 
                              src={article.author?.avatarUrl || `https://picsum.photos/seed/${article.author?.id}/24/24`}
                              alt={article.author?.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="text-sm text-gray-600">{article.author?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded">{article.category}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Eye size={12} /> {article.viewCount}</span>
                            <span className="flex items-center gap-1"><Heart size={12} /> {article.likeCount}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {article.isPinned ? (
                            <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded">置顶</span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">正常</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handlePinArticle(article.id)}
                              className="p-1 text-gray-400 hover:text-teal-600 transition-colors"
                              title={article.isPinned ? '取消置顶' : '置顶'}
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => navigate(`/articles/${article.id}`)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="查看"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteArticle(article.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="删除"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'activities' ? (
            /* Activities Management */
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">活动列表</h3>
                <button className="bg-teal-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors flex items-center gap-1">
                  <Plus size={16} /> 新建活动
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">活动名称</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">类型</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">时间</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">报名/容量</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">状态</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activities.map(activity => (
                      <tr key={activity.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 text-sm line-clamp-1">{activity.title}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded">{activity.type}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(activity.startTime).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                          {activity.registrations || 0}/{activity.capacity || '无限'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {activity.status === 'upcoming' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">即将开始</span>}
                          {activity.status === 'ongoing' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">进行中</span>}
                          {activity.status === 'ended' && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">已结束</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                              <Eye size={16} />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-teal-600 transition-colors">
                              <Edit2 size={16} />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'products' ? (
            /* Products Management */
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">商品列表</h3>
                <button className="bg-teal-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors flex items-center gap-1">
                  <Plus size={16} /> 新建商品
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">商品</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">分类</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">积分</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">库存</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                                  <Gift size={20} className="text-white/80" />
                                </div>
                              )}
                            </div>
                            <p className="font-medium text-gray-800 text-sm">{product.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded">{product.category}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-orange-500">{product.points}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-1 text-gray-400 hover:text-teal-600 transition-colors">
                              <Edit2 size={16} />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Users Management */
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <Users size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">用户管理功能开发中...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
