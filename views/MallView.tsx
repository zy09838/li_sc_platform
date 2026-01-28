
import React, { useState } from 'react';
import { MOCK_PRODUCTS } from '../constants';
import { ShoppingBag, Star, Zap, CheckCircle2, AlertCircle, Filter, Search, Gift, X, Calendar, BookOpen, ArrowRight } from 'lucide-react';
import { NavTab } from '../types';

interface MallViewProps {
  userPoints: number;
  onRedeem: (cost: number) => boolean;
  onNavigate: (tab: NavTab) => void;
}

export const MallView: React.FC<MallViewProps> = ({ userPoints, onRedeem, onNavigate }) => {
  const [filter, setFilter] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  
  // Advanced Error Handling State
  const [insufficientData, setInsufficientData] = useState<{
    productName: string;
    cost: number;
    diff: number;
  } | null>(null);

  const categories = ['全部', '品牌服饰', '精品车模', '办公文创', '生活周边', '学习资料', '车用配件'];

  const filteredProducts = MOCK_PRODUCTS.filter(product => {
    const matchesCategory = filter === '全部' || product.category === filter;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRedeemClick = (productName: string, cost: number) => {
    setInsufficientData(null);
    setRedeemSuccess(null);

    const success = onRedeem(cost);
    if (success) {
      setRedeemSuccess(`成功兑换：${productName}`);
      setTimeout(() => setRedeemSuccess(null), 3000);
    } else {
      setInsufficientData({
        productName,
        cost,
        diff: cost - userPoints
      });
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Success Notification Toast */}
      {redeemSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-xl z-[70] flex items-center gap-2 animate-in fade-in zoom-in duration-300 backdrop-blur-sm">
           <CheckCircle2 size={20} /> {redeemSuccess}
        </div>
      )}

      {/* Insufficient Points Modal */}
      {insufficientData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="bg-orange-50 p-6 flex items-center justify-between border-b border-orange-100">
               <div className="flex items-center gap-3 text-orange-600">
                  <div className="bg-white p-2 rounded-xl shadow-sm"><AlertCircle size={24} /></div>
                  <h3 className="font-bold text-lg">哎呀，积分还差一点点...</h3>
               </div>
               <button onClick={() => setInsufficientData(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
               </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
               <div className="text-center mb-8">
                  <p className="text-gray-500 text-sm mb-2">您正在尝试兑换</p>
                  <p className="text-gray-900 font-bold mb-4">{insufficientData.productName}</p>
                  <div className="bg-gray-50 rounded-2xl py-4 px-6 inline-block">
                     <p className="text-xs text-gray-400 mb-1">距离兑换还差</p>
                     <p className="text-3xl font-mono font-black text-orange-500 flex items-center justify-center gap-1">
                        <Zap size={20} fill="currentColor" /> {insufficientData.diff}
                     </p>
                  </div>
               </div>

               <p className="text-sm font-bold text-gray-800 mb-4 text-center">别担心！您可以通过以下方式快速赚取积分：</p>
               
               <div className="space-y-3">
                  <button 
                    onClick={() => onNavigate(NavTab.ACTIVITY)}
                    className="w-full flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all group"
                  >
                     <div className="bg-teal-100 text-teal-700 p-2.5 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        <Calendar size={20} />
                     </div>
                     <div className="text-left flex-1">
                        <p className="font-bold text-sm text-gray-800">参与社区活动</p>
                        <p className="text-[10px] text-gray-400">报名并出席线下/线上活动可得 50-200 积分</p>
                     </div>
                     <ArrowRight size={16} className="text-gray-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                  </button>

                  <button 
                    onClick={() => onNavigate(NavTab.TRAINING)}
                    className="w-full flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                     <div className="bg-blue-100 text-blue-700 p-2.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <BookOpen size={20} />
                     </div>
                     <div className="text-left flex-1">
                        <p className="font-bold text-sm text-gray-800">学习专业知识</p>
                        <p className="text-[10px] text-gray-400">完成在线课程学习或下载 SOP 可得 10-50 积分</p>
                     </div>
                     <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
               <button 
                  onClick={() => setInsufficientData(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-medium"
               >
                  我知道了，先看看别的
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-700 rounded-2xl p-8 text-white relative overflow-hidden shadow-md">
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
               <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                 <Gift size={32} /> 理链积分商城
               </h2>
               <p className="text-teal-100 opacity-90 max-w-md">
                 您的每一份付出都值得被奖励。用积分兑换专属文化周边，彰显理链人身份。
               </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-[200px] border border-white/20 text-center">
               <div className="text-sm text-teal-100 mb-1">当前可用积分</div>
               <div className="text-4xl font-bold font-mono tracking-wider flex items-center justify-center gap-2">
                 <Zap size={24} className="fill-yellow-400 text-yellow-400" />
                 {userPoints}
               </div>
               <div className="text-xs text-teal-200 mt-2">再积累 800 分可升级 LV.9</div>
            </div>
         </div>
         {/* Decor */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
         <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400 opacity-10 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl"></div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-20 z-20">
         <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
            <span className="text-gray-400 text-sm flex items-center gap-1 shrink-0"><Filter size={14}/> 分类:</span>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === cat 
                    ? 'bg-teal-600 text-white shadow-sm' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
         </div>
         
         <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索商品..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
            />
         </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
               <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  
                  {/* Tags */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                     {product.isHot && (
                       <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                         <Star size={8} fill="currentColor" /> 热销
                       </span>
                     )}
                     {product.isNew && (
                       <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                         NEW
                       </span>
                     )}
                  </div>
                  
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded backdrop-blur-sm">
                     库存: {product.stock}
                  </div>
               </div>
               
               <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded">{product.category}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2 min-h-[40px]" title={product.name}>{product.name}</h3>
                  
                  <div className="mt-auto flex items-end justify-between">
                     <div className="text-teal-700 font-bold text-lg flex items-center gap-1">
                        {product.price} <span className="text-xs font-normal text-gray-500">积分</span>
                     </div>
                     <button 
                       onClick={() => handleRedeemClick(product.name, product.price)}
                       disabled={product.stock <= 0}
                       className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                         product.stock > 0 
                           ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-200' 
                           : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                       }`}
                     >
                       <ShoppingBag size={14} /> {product.stock > 0 ? '立即兑换' : '已售罄'}
                     </button>
                  </div>
               </div>
            </div>
         ))}
      </div>
      
      {filteredProducts.length === 0 && (
         <div className="text-center py-20">
            <div className="bg-gray-100 p-4 rounded-full inline-block text-gray-400 mb-4">
               <ShoppingBag size={48} />
            </div>
            <p className="text-gray-500">没有找到相关商品</p>
         </div>
      )}
    </div>
  );
};
