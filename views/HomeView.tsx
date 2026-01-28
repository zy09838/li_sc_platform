import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, Clock, Eye, Heart, MessageSquare, Calendar, MapPin, Users, Flame, BookOpen, Gift, Sparkles, ChevronRight } from 'lucide-react';
import { articlesApi, activitiesApi, coursesApi, productsApi, wishesApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { SkeletonCard, SkeletonList } from '../components/Loading';

interface Article {
  id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  category: string;
  viewCount: number;
  likeCount: number;
  author: { name: string; avatarUrl?: string };
  createdAt: string;
}

interface Activity {
  id: string;
  title: string;
  type: string;
  status: string;
  startTime: string;
  location?: string;
  registrations?: number;
  capacity?: number;
}

interface Course {
  id: string;
  title: string;
  category: string;
  thumbnail?: string;
  progress?: number;
  duration?: number;
}

interface Product {
  id: string;
  name: string;
  points: number;
  imageUrl?: string;
  stock: number;
}

export const HomeView: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [hotArticles, setHotArticles] = useState<Article[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState({
    articles: true,
    activities: true,
    courses: true,
    products: true
  });

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    // Load all data in parallel
    const loadArticles = async () => {
      try {
        const response: any = await articlesApi.getHot(5);
        if (response.success) {
          setHotArticles(response.data);
        }
      } catch (e) {
        console.error('Load articles failed:', e);
      } finally {
        setLoading(prev => ({ ...prev, articles: false }));
      }
    };

    const loadActivities = async () => {
      try {
        const response: any = await activitiesApi.list({ limit: 4, status: 'upcoming' });
        if (response.success) {
          setRecentActivities(response.data.activities);
        }
      } catch (e) {
        console.error('Load activities failed:', e);
      } finally {
        setLoading(prev => ({ ...prev, activities: false }));
      }
    };

    const loadCourses = async () => {
      try {
        const response: any = await coursesApi.list({ limit: 4 });
        if (response.success) {
          setRecommendedCourses(response.data.courses);
        }
      } catch (e) {
        console.error('Load courses failed:', e);
      } finally {
        setLoading(prev => ({ ...prev, courses: false }));
      }
    };

    const loadProducts = async () => {
      try {
        const response: any = await productsApi.list({ limit: 4 });
        if (response.success) {
          setHotProducts(response.data.products);
        }
      } catch (e) {
        console.error('Load products failed:', e);
      } finally {
        setLoading(prev => ({ ...prev, products: false }));
      }
    };

    await Promise.all([loadArticles(), loadActivities(), loadCourses(), loadProducts()]);
  };

  const getActivityStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px]">即将开始</span>;
      case 'ongoing':
        return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px]">进行中</span>;
      default:
        return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px]">已结束</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">欢迎来到理链平台 👋</h1>
          <p className="text-teal-100 text-sm mb-4">理想供应链员工服务平台，连接你我，共创价值</p>
          <div className="flex gap-3">
            <Link
              to="/articles"
              className="bg-white text-teal-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-50 transition-colors"
            >
              浏览文章
            </Link>
            <Link
              to="/activities"
              className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors border border-white/20"
            >
              查看活动
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/articles" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">文章专区</p>
              <p className="font-bold text-gray-800">精选好文</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-teal-600 group-hover:translate-x-1 transition-transform flex items-center">
            前往浏览 <ChevronRight size={14} />
          </div>
        </Link>
        
        <Link to="/activities" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">活动专区</p>
              <p className="font-bold text-gray-800">精彩活动</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-teal-600 group-hover:translate-x-1 transition-transform flex items-center">
            立即报名 <ChevronRight size={14} />
          </div>
        </Link>
        
        <Link to="/training" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">培训中心</p>
              <p className="font-bold text-gray-800">在线学习</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-teal-600 group-hover:translate-x-1 transition-transform flex items-center">
            开始学习 <ChevronRight size={14} />
          </div>
        </Link>
        
        <Link to="/mall" className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
              <Gift size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">积分商城</p>
              <p className="font-bold text-gray-800">好礼兑换</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-teal-600 group-hover:translate-x-1 transition-transform flex items-center">
            去兑换 <ChevronRight size={14} />
          </div>
        </Link>
      </div>

      {/* Hot Articles */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Flame size={20} className="text-red-500" /> 热门文章
          </h2>
          <Link to="/articles" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
            查看更多 <ArrowRight size={14} />
          </Link>
        </div>
        
        {loading.articles ? (
          <SkeletonList count={3} />
        ) : hotArticles.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100">
            暂无文章
          </div>
        ) : (
          <div className="space-y-3">
            {hotArticles.map((article, index) => (
              <Link
                key={article.id}
                to={`/articles/${article.id}`}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex gap-4 group"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg text-gray-500 font-bold text-sm shrink-0">
                  {index + 1}
                </div>
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-20 h-14 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 line-clamp-1 group-hover:text-teal-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-1">{article.summary}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                    <span className="bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded">{article.category}</span>
                    <span className="flex items-center gap-1"><Eye size={10} /> {article.viewCount}</span>
                    <span className="flex items-center gap-1"><Heart size={10} /> {article.likeCount}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Activities */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calendar size={20} className="text-purple-500" /> 近期活动
          </h2>
          <Link to="/activities" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
            查看更多 <ArrowRight size={14} />
          </Link>
        </div>
        
        {loading.activities ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : recentActivities.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100">
            暂无活动
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentActivities.map(activity => (
              <Link
                key={activity.id}
                to={`/activities/${activity.id}`}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  {getActivityStatusBadge(activity.status)}
                  <span className="text-[10px] text-gray-400">{activity.type}</span>
                </div>
                <h3 className="font-medium text-gray-800 line-clamp-1">{activity.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(activity.startTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  </span>
                  {activity.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {activity.location}
                    </span>
                  )}
                  {activity.capacity && (
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {activity.registrations || 0}/{activity.capacity}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recommended Courses */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BookOpen size={20} className="text-green-500" /> 推荐课程
          </h2>
          <Link to="/training" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
            查看更多 <ArrowRight size={14} />
          </Link>
        </div>
        
        {loading.courses ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : recommendedCourses.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100">
            暂无课程
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendedCourses.map(course => (
              <Link
                key={course.id}
                to="/training"
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className="h-24 bg-gray-100">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                      <BookOpen size={32} className="text-white/80" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-800 text-sm line-clamp-1 group-hover:text-teal-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-1">{course.category}</p>
                  {course.progress !== undefined && (
                    <div className="mt-2">
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-teal-500 transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{course.progress}% 已学习</p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Hot Products */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Gift size={20} className="text-orange-500" /> 热门兑换
          </h2>
          <Link to="/mall" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
            查看更多 <ArrowRight size={14} />
          </Link>
        </div>
        
        {loading.products ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : hotProducts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-100">
            暂无商品
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {hotProducts.map(product => (
              <Link
                key={product.id}
                to="/mall"
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className="h-24 bg-gray-100">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                      <Gift size={32} className="text-white/80" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-800 text-sm line-clamp-1 group-hover:text-teal-600 transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-orange-500 font-bold text-sm">{product.points} 积分</span>
                    <span className="text-[10px] text-gray-400">库存 {product.stock}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
