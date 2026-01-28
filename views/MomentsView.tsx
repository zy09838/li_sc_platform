import React, { useState, useEffect } from 'react';
import { MOCK_WISHES, MOCK_FOOD } from '../constants';
import { Heart, Plus, Star, MapPin, X } from 'lucide-react';

interface MomentsViewProps {
  triggerCreate?: boolean;
}

export const MomentsView: React.FC<MomentsViewProps> = ({ triggerCreate }) => {
  const [activeTab, setActiveTab] = useState('wishes'); // 'wishes' or 'food'
  const [wishes, setWishes] = useState(MOCK_WISHES);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWish, setNewWish] = useState({ content: '', color: 'bg-yellow-100' });

  useEffect(() => {
    if (triggerCreate) {
      setActiveTab('wishes');
      setIsModalOpen(true);
    }
  }, [triggerCreate]);

  const colors = [
    { name: 'yellow', val: 'bg-yellow-100' },
    { name: 'pink', val: 'bg-pink-100' },
    { name: 'blue', val: 'bg-blue-100' },
    { name: 'green', val: 'bg-green-100' },
    { name: 'purple', val: 'bg-purple-100' },
  ];

  const handleAddWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWish.content) return;

    const wish = {
      id: Date.now().toString(),
      content: newWish.content,
      color: newWish.color,
      author: '我',
      likes: 0
    };

    setWishes([wish, ...wishes]);
    setIsModalOpen(false);
    setNewWish({ content: '', color: 'bg-yellow-100' });
  };

  return (
    <div className="space-y-6 relative">
      {/* Sub-navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white p-1 rounded-full shadow-sm border border-gray-100 inline-flex">
           <button 
             onClick={() => setActiveTab('wishes')}
             className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
               activeTab === 'wishes' 
                 ? 'bg-teal-700 text-white shadow-md' 
                 : 'text-gray-500 hover:text-gray-800'
             }`}
           >
             匿名许愿墙
           </button>
           <button 
             onClick={() => setActiveTab('food')}
             className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
               activeTab === 'food' 
                 ? 'bg-orange-500 text-white shadow-md' 
                 : 'text-gray-500 hover:text-gray-800'
             }`}
           >
             美食推荐榜
           </button>
        </div>
      </div>

      {activeTab === 'wishes' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="flex justify-between items-center bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-xl text-white shadow-lg">
              <div>
                <h2 className="text-2xl font-bold mb-1">写下心愿，静待花开</h2>
                <p className="opacity-80 text-sm">在这里，你可以匿名写下工作或生活中的小愿望</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur-sm flex items-center gap-2 text-sm transition-colors"
              >
                <Plus size={16} /> 我要许愿
              </button>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* New Wish Card Trigger */}
              <div 
                onClick={() => setIsModalOpen(true)}
                className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 h-48 cursor-pointer hover:border-teal-500 hover:text-teal-500 hover:bg-teal-50/50 transition-all group"
              >
                 <div className="bg-gray-100 p-3 rounded-full mb-2 group-hover:bg-teal-100 transition-colors">
                   <Plus size={24} />
                 </div>
                 <span className="text-sm font-medium">添加新愿望</span>
              </div>

              {wishes.map(wish => (
                <div key={wish.id} className={`${wish.color} p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow relative group h-48 flex flex-col justify-between transform hover:-translate-y-1 duration-300`}>
                  <div className="text-gray-800 font-handwriting text-lg leading-relaxed line-clamp-4">
                    "{wish.content}"
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 font-medium mt-auto pt-4">
                    <span>— {wish.author}</span>
                    <button className="flex items-center gap-1 bg-white/50 px-2 py-1 rounded hover:bg-white/80 transition-colors">
                      <Heart size={12} className={wish.likes > 0 ? "text-red-500 fill-red-500" : "text-gray-500"} /> {wish.likes} 帮他实现
                    </button>
                  </div>
                </div>
              ))}
           </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
           <div className="flex justify-between items-center bg-gradient-to-r from-orange-400 to-red-500 p-6 rounded-xl text-white shadow-lg">
              <div>
                <h2 className="text-2xl font-bold mb-1">干饭人集合！</h2>
                <p className="opacity-80 text-sm">发现公司周边的宝藏美食，不仅是工作，更要好好吃饭</p>
              </div>
              <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur-sm flex items-center gap-2 text-sm transition-colors">
                <Plus size={16} /> 推荐美食
              </button>
           </div>

           <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
             {MOCK_FOOD.map(food => (
               <div key={food.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 break-inside-avoid hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img src={food.image} alt={food.name} className="w-full h-48 object-cover" />
                    <span className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded text-xs font-bold text-orange-500 flex items-center gap-1 shadow-sm">
                      <Star size={10} fill="currentColor" /> {food.rating}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 text-lg mb-2">{food.name}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {food.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-orange-50 text-orange-600 px-2 py-1 rounded-full">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                       <button className="text-xs text-gray-500 hover:text-orange-500 flex items-center gap-1">
                         <MapPin size={12} /> 查看位置
                       </button>
                       <button className="text-xs font-medium text-teal-600 hover:text-teal-800">
                         查看详情
                       </button>
                    </div>
                  </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Add Wish Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200 shadow-2xl">
             <button 
               onClick={() => setIsModalOpen(false)} 
               className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
             >
               <X size={20} />
             </button>
             <h3 className="text-xl font-bold mb-6 text-gray-800">许下一个愿望</h3>
             
             <form onSubmit={handleAddWish} className="space-y-4">
               <div>
                 <textarea 
                   rows={4}
                   value={newWish.content}
                   onChange={(e) => setNewWish({...newWish, content: e.target.value})}
                   placeholder="希望今年可以..." 
                   className={`w-full ${newWish.color} border border-transparent rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none text-lg font-handwriting`}
                   required
                 />
               </div>
               
               <div>
                 <label className="block text-xs font-medium text-gray-500 mb-2">选择便签颜色</label>
                 <div className="flex gap-2">
                    {colors.map(c => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setNewWish({...newWish, color: c.val})}
                        className={`w-8 h-8 rounded-full ${c.val} border-2 transition-transform hover:scale-110 ${newWish.color === c.val ? 'border-teal-500' : 'border-transparent'}`}
                      />
                    ))}
                 </div>
               </div>

               <button 
                 type="submit"
                 className="w-full py-2.5 bg-teal-700 text-white rounded-lg text-sm font-bold hover:bg-teal-800 transition-colors shadow-sm mt-2"
               >
                 贴上许愿墙
               </button>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};