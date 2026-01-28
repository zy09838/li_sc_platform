import React from 'react';
import { MOCK_ARTICLES, MOCK_ACTIVITIES } from '../constants';
import { ArrowRight, Flame, FileText, Calendar } from 'lucide-react';
import { Article, Activity } from '../types';

interface HomeViewProps {
  onArticleClick?: (article: Article) => void;
  onActivityClick?: (activity: Activity) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onArticleClick, onActivityClick }) => {
  const hotArticles = MOCK_ARTICLES.filter(a => a.views > 100);
  const exclusiveResearch = MOCK_ARTICLES.filter(a => a.category === '产业研究' || a.category === '供应链发文');
  const upcomingActivity = MOCK_ACTIVITIES.find(a => a.status === 'Upcoming');
  
  // Find the specific activity for the banner (simulated linkage)
  const bannerActivity = MOCK_ACTIVITIES.find(a => a.title.includes('合作伙伴大会'));

  return (
    <div className="space-y-6">
      {/* Hero Carousel Area */}
      <div 
        className="relative bg-gray-900 rounded-2xl overflow-hidden h-64 flex items-center group cursor-pointer"
        onClick={() => bannerActivity && onActivityClick && onActivityClick(bannerActivity)}
      >
        <img 
          src="https://picsum.photos/id/196/1200/400" 
          alt="Banner" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
        />
        <div className="relative z-10 px-10 max-w-2xl">
           <span className="inline-block bg-teal-600 text-white text-xs font-bold px-2 py-1 rounded mb-4">年度盛典</span>
           <h1 className="text-4xl font-bold text-white mb-4 leading-tight">2026年 供应链合作伙伴大会<br/>即将启幕</h1>
           <p className="text-gray-200 mb-6 line-clamp-2">诚邀各位合作伙伴共襄盛举，探讨未来供应链发展新趋势，共创双赢局面。</p>
           <button className="bg-white text-gray-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2">
             立即查看 <ArrowRight size={16} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {/* Real-time Hot Recommendations */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
               <div className="bg-red-100 p-1.5 rounded-lg text-red-600">
                 <Flame size={20} />
               </div>
               <h3 className="font-bold text-gray-800 text-lg">实时热推</h3>
            </div>
            <div className="flex-1 space-y-4">
               {hotArticles.slice(0, 3).map((article, idx) => (
                 <div 
                    key={article.id} 
                    className="flex gap-3 group cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded transition-colors"
                    onClick={() => onArticleClick && onArticleClick(article)}
                 >
                    <span className={`text-lg font-bold w-6 text-center ${idx === 0 ? 'text-red-500' : idx === 1 ? 'text-orange-500' : 'text-gray-400'}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-teal-700 transition-colors">
                        {article.title}
                      </h4>
                      <span className="text-xs text-gray-400 mt-1 block">{article.views} 热度</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Exclusive Production Research */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
               <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                 <FileText size={20} />
               </div>
               <h3 className="font-bold text-gray-800 text-lg">独家产研</h3>
            </div>
            <div className="flex-1 space-y-4">
               {exclusiveResearch.slice(0, 2).map((article) => (
                 <div 
                    key={article.id} 
                    className="group cursor-pointer border-b border-gray-50 last:border-0 pb-3 last:pb-0 hover:bg-gray-50 p-2 -mx-2 rounded transition-colors"
                    onClick={() => onArticleClick && onArticleClick(article)}
                 >
                    <div className="flex justify-between items-start mb-1">
                       <span className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded">{article.tags[0]}</span>
                       <span className="text-[10px] text-gray-400">{article.date}</span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-800 line-clamp-1 mb-1 group-hover:text-blue-700 transition-colors">
                      {article.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                 </div>
               ))}
            </div>
         </div>

         {/* Activity Warm-up */}
         <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl shadow-sm border border-teal-100 p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
               <div className="bg-teal-100 p-1.5 rounded-lg text-teal-700">
                 <Calendar size={20} />
               </div>
               <h3 className="font-bold text-gray-800 text-lg">活动预热</h3>
            </div>
            
            {upcomingActivity && (
              <div className="flex-1 flex flex-col justify-between">
                <div 
                  className="cursor-pointer group"
                  onClick={() => onActivityClick && onActivityClick(upcomingActivity)}
                >
                  <div className="relative rounded-lg overflow-hidden h-32 mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                    <img src={upcomingActivity.image} alt="Act" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      火热报名中
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-teal-700 transition-colors">{upcomingActivity.title}</h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={10} /> {upcomingActivity.date}
                  </p>
                </div>
                <button 
                  onClick={() => onActivityClick && onActivityClick(upcomingActivity)}
                  className="w-full mt-4 bg-teal-700 text-white py-2 rounded-lg text-xs font-bold hover:bg-teal-800 transition-colors shadow-sm shadow-teal-200"
                >
                   立即报名
                </button>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};