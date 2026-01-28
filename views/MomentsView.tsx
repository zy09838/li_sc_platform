import React, { useState, useEffect } from 'react';
import { Heart, Send, Star, Plus, Utensils, Sparkles, Loader2, X } from 'lucide-react';
import { wishesApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Loading, SkeletonCard } from '../components/Loading';

interface Wish {
  id: string;
  content: string;
  color?: string;
  isAnonymous: boolean;
  likeCount: number;
  isLiked?: boolean;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface FoodRecommendation {
  id: string;
  name: string;
  rating: number;
  imageUrl?: string;
  tags?: string[];
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

export const MomentsView: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'wishes' | 'food'>('wishes');
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [foods, setFoods] = useState<FoodRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWishModal, setShowWishModal] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  
  // Wish form
  const [wishText, setWishText] = useState('');
  const [wishColor, setWishColor] = useState('bg-yellow-100');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submittingWish, setSubmittingWish] = useState(false);
  
  // Food form
  const [foodName, setFoodName] = useState('');
  const [foodRating, setFoodRating] = useState(5);
  const [foodTags, setFoodTags] = useState('');
  const [submittingFood, setSubmittingFood] = useState(false);

  const colors = [
    'bg-yellow-100', 'bg-pink-100', 'bg-green-100', 'bg-blue-100', 
    'bg-purple-100', 'bg-orange-100', 'bg-red-100', 'bg-teal-100'
  ];

  useEffect(() => {
    if (activeTab === 'wishes') {
      loadWishes();
    } else {
      loadFoods();
    }
  }, [activeTab]);

  const loadWishes = async () => {
    setLoading(true);
    try {
      const response: any = await wishesApi.list(1, 50);
      if (response.success) {
        setWishes(response.data.wishes);
      }
    } catch (error) {
      console.error('Failed to load wishes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFoods = async () => {
    setLoading(true);
    try {
      const response: any = await wishesApi.getFoods(1, 50);
      if (response.success) {
        setFoods(response.data.foods);
      }
    } catch (error) {
      console.error('Failed to load foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeWish = async (wishId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      const response: any = await wishesApi.like(wishId);
      if (response.success) {
        setWishes(prev => prev.map(w => 
          w.id === wishId
            ? { ...w, isLiked: !w.isLiked, likeCount: w.isLiked ? w.likeCount - 1 : w.likeCount + 1 }
            : w
        ));
      }
    } catch (error) {
      console.error('Like failed:', error);
    }
  };

  const handleSubmitWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishText.trim() || !isAuthenticated) {
      if (!isAuthenticated) navigate('/login');
      return;
    }
    
    setSubmittingWish(true);
    try {
      const response: any = await wishesApi.create({
        content: wishText.trim(),
        isAnonymous,
        color: wishColor
      });
      if (response.success) {
        setWishes(prev => [response.data, ...prev]);
        setWishText('');
        setIsAnonymous(false);
        setShowWishModal(false);
      }
    } catch (error) {
      console.error('Submit wish failed:', error);
    } finally {
      setSubmittingWish(false);
    }
  };

  const handleSubmitFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim() || !isAuthenticated) {
      if (!isAuthenticated) navigate('/login');
      return;
    }
    
    setSubmittingFood(true);
    try {
      const response: any = await wishesApi.createFood({
        name: foodName.trim(),
        rating: foodRating,
        tags: foodTags.split(',').map(t => t.trim()).filter(Boolean)
      });
      if (response.success) {
        setFoods(prev => [response.data, ...prev]);
        setFoodName('');
        setFoodRating(5);
        setFoodTags('');
        setShowFoodModal(false);
      }
    } catch (error) {
      console.error('Submit food failed:', error);
    } finally {
      setSubmittingFood(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">动态广场</h1>
          <p className="text-sm text-gray-500 mt-1">分享生活，传递温暖</p>
        </div>
        <button
          onClick={() => activeTab === 'wishes' ? setShowWishModal(true) : setShowFoodModal(true)}
          className="bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          {activeTab === 'wishes' ? '写心愿' : '推荐美食'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('wishes')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'wishes'
              ? 'bg-teal-700 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Sparkles size={16} /> 心愿墙
        </button>
        <button
          onClick={() => setActiveTab('food')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'food'
              ? 'bg-teal-700 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Utensils size={16} /> 美食推荐
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : activeTab === 'wishes' ? (
        /* Wishes Grid */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {wishes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              <Sparkles size={48} className="mx-auto mb-3 opacity-30" />
              <p>暂无心愿，快来许下第一个心愿吧</p>
            </div>
          ) : (
            wishes.map(wish => (
              <div
                key={wish.id}
                className={`${wish.color || 'bg-yellow-100'} rounded-xl p-4 shadow-sm hover:shadow-md transition-all transform hover:-rotate-1 group`}
              >
                <p className="text-gray-800 text-sm mb-3 line-clamp-4">{wish.content}</p>
                <div className="flex items-center justify-between pt-2 border-t border-black/5">
                  <div className="flex items-center gap-2">
                    {!wish.isAnonymous && wish.author ? (
                      <>
                        <img
                          src={wish.author.avatarUrl || `https://picsum.photos/seed/${wish.author.id}/24/24`}
                          alt={wish.author.name}
                          className="w-5 h-5 rounded-full border border-white"
                        />
                        <span className="text-xs text-gray-600">{wish.author.name}</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">匿名</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleLikeWish(wish.id)}
                    className={`flex items-center gap-1 text-xs ${
                      wish.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                    } transition-colors`}
                  >
                    <Heart size={14} fill={wish.isLiked ? 'currentColor' : 'none'} />
                    <span>{wish.likeCount}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Food Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {foods.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              <Utensils size={48} className="mx-auto mb-3 opacity-30" />
              <p>暂无美食推荐，快来分享你的美食吧</p>
            </div>
          ) : (
            foods.map(food => (
              <div
                key={food.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex gap-4"
              >
                {food.imageUrl && (
                  <img
                    src={food.imageUrl}
                    alt={food.name}
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{food.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < food.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">{food.rating}.0</span>
                  </div>
                  {food.tags && food.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {food.tags.map(tag => (
                        <span key={tag} className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-[10px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
                    {food.author ? (
                      <>
                        <img
                          src={food.author.avatarUrl || `https://picsum.photos/seed/${food.author.id}/20/20`}
                          alt={food.author.name}
                          className="w-4 h-4 rounded-full"
                        />
                        <span className="text-[10px] text-gray-400">{food.author.name} 推荐</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-400">匿名推荐</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Wish Modal */}
      {showWishModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-teal-700 p-6 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Sparkles size={20} /> 写下你的心愿
              </h3>
              <button onClick={() => setShowWishModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitWish} className="p-6">
              <textarea
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                placeholder="写下你的心愿或想说的话..."
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
                rows={4}
                maxLength={200}
              />
              <div className="flex justify-end text-xs text-gray-400 mt-1">
                {wishText.length}/200
              </div>
              
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">选择颜色</p>
                <div className="flex gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setWishColor(color)}
                      className={`w-8 h-8 rounded-full ${color} ${
                        wishColor === color ? 'ring-2 ring-offset-2 ring-teal-500' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <label className="flex items-center gap-2 mt-4 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                匿名发布
              </label>
              
              <button
                type="submit"
                disabled={!wishText.trim() || submittingWish}
                className="w-full mt-6 bg-teal-700 text-white py-3 rounded-lg font-medium hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submittingWish ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Send size={18} />
                )}
                发布心愿
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Food Modal */}
      {showFoodModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-orange-600 p-6 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Utensils size={20} /> 推荐美食
              </h3>
              <button onClick={() => setShowFoodModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitFood} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">美食名称</label>
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="如：园区小食堂的红烧肉"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">评分</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFoodRating(i)}
                      className="p-1"
                    >
                      <Star
                        size={24}
                        className={i <= foodRating ? 'text-yellow-400 fill-current' : 'text-gray-200'}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
                <input
                  type="text"
                  value={foodTags}
                  onChange={(e) => setFoodTags(e.target.value)}
                  placeholder="如：辣,实惠,分量足（用逗号分隔）"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              
              <button
                type="submit"
                disabled={!foodName.trim() || submittingFood}
                className="w-full mt-2 bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submittingFood ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Send size={18} />
                )}
                发布推荐
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
