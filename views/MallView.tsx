import React, { useState, useEffect } from 'react';
import { Gift, ShoppingCart, Filter, Search, Package, Clock, CheckCircle, X, Loader2, ChevronRight, Zap } from 'lucide-react';
import { productsApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../components/Loading';

interface Product {
  id: string;
  name: string;
  description?: string;
  points: number;
  price?: number;
  imageUrl?: string;
  category: string;
  stock: number;
  isHot?: boolean;
}

interface Order {
  id: string;
  productId: string;
  product: Product;
  points: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const MallView: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updatePoints } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [exchanging, setExchanging] = useState(false);
  const [exchangeSuccess, setExchangeSuccess] = useState(false);

  useEffect(() => {
    if (activeTab === 'products') {
      loadProducts();
      loadCategories();
    } else {
      loadOrders();
    }
  }, [activeTab]);

  const loadProducts = async (page = 1) => {
    setLoading(true);
    try {
      const response: any = await productsApi.list({
        page,
        limit: 12,
        category: categoryFilter || undefined
      });
      if (response.success) {
        const normalizedProducts = response.data.products.map((product: Product) => ({
          ...product,
          points: Number(
            (product as any).points ??
            (product as any).price ??
            0
          )
        }));
        let filtered = normalizedProducts;
        if (searchQuery) {
          filtered = filtered.filter((p: Product) => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setProducts(filtered);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Load products failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response: any = await productsApi.getCategories();
      if (response.success) {
        const normalized = Array.isArray(response.data)
          ? response.data
              .map((item: any) => (typeof item === 'string' ? item : item?.name))
              .filter(Boolean)
          : [];
        setCategories(normalized);
      }
    } catch (error) {
      console.error('Load categories failed:', error);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response: any = await productsApi.getOrders();
      if (response.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Load orders failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExchange = async () => {
    if (!selectedProduct || !isAuthenticated || !user) return;
    
    if ((user.points || 0) < selectedProduct.points) {
      return;
    }
    
    setExchanging(true);
    try {
      const response: any = await productsApi.createOrder(selectedProduct.id);
      if (response.success) {
        setExchangeSuccess(true);
        updatePoints((user.points || 0) - selectedProduct.points);
        // Update stock
        setProducts(prev => prev.map(p => 
          p.id === selectedProduct.id ? { ...p, stock: p.stock - 1 } : p
        ));
        setTimeout(() => {
          setShowConfirmModal(false);
          setExchangeSuccess(false);
          setSelectedProduct(null);
        }, 2000);
      }
    } catch (error) {
      console.error('Exchange failed:', error);
    } finally {
      setExchanging(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '待处理' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: '处理中' },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-700', label: '已发货' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: '已完成' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-500', label: '已取消' },
    };
    const s = statusMap[status] || statusMap.pending;
    return <span className={`${s.bg} ${s.text} px-2 py-0.5 rounded text-xs`}>{s.label}</span>;
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">积分商城</h1>
          <p className="text-sm text-gray-500 mt-1">用积分兑换心仪好礼</p>
        </div>
        {isAuthenticated && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <Zap size={18} fill="currentColor" />
            <span className="font-bold text-lg">{user?.points || 0}</span>
            <span className="text-xs opacity-80">可用积分</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'products'
              ? 'bg-teal-700 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Gift size={16} /> 商品列表
        </button>
        {isAuthenticated && (
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-teal-700 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Package size={16} /> 我的订单
          </button>
        )}
      </div>

      {activeTab === 'products' && (
        /* Filters */
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadProducts(1)}
                placeholder="搜索商品..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); loadProducts(1); }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              >
                <option value="">全部分类</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : activeTab === 'products' ? (
        products.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Gift size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">暂无商品</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(product => (
                <div 
                  key={product.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all group cursor-pointer"
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login');
                      return;
                    }
                    setSelectedProduct(product);
                    setShowConfirmModal(true);
                  }}
                >
                  <div className="h-32 bg-gray-100 relative">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                        <Gift size={40} className="text-white/80" />
                      </div>
                    )}
                    {product.isHot && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                        热门
                      </span>
                    )}
                    {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold">已售罄</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{product.category}</span>
                    <h3 className="font-medium text-gray-800 text-sm line-clamp-1 mt-1 group-hover:text-teal-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-orange-500 font-bold">{product.points} <span className="text-xs font-normal">积分</span></span>
                      <span className="text-[10px] text-gray-400">库存 {product.stock}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {Array.from({ length: pagination.totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => loadProducts(i + 1)}
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
          </>
        )
      ) : (
        /* Orders */
        orders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">暂无订单</p>
            <button 
              onClick={() => setActiveTab('products')}
              className="mt-4 text-teal-600 hover:text-teal-700 text-sm"
            >
              去兑换商品
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                  {order.product.imageUrl ? (
                    <img src={order.product.imageUrl} alt={order.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                      <Gift size={24} className="text-white/80" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">{order.product.name}</h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">兑换积分：{order.points}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                    <span>订单号：{order.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Confirm Modal */}
      {showConfirmModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            {exchangeSuccess ? (
              /* Success State */
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">兑换成功！</h3>
                <p className="text-sm text-gray-500">您的订单已提交，请关注订单状态</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">确认兑换</h3>
                  <button onClick={() => { setShowConfirmModal(false); setSelectedProduct(null); }}>
                    <X size={20} className="text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                      {selectedProduct.imageUrl ? (
                        <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                          <Gift size={32} className="text-white/80" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{selectedProduct.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{selectedProduct.description}</p>
                      <p className="text-orange-500 font-bold text-lg mt-2">{selectedProduct.points} 积分</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">当前积分</span>
                      <span className="font-bold text-gray-800">{user?.points || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-500">需要积分</span>
                      <span className="font-bold text-orange-500">-{selectedProduct.points}</span>
                    </div>
                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">兑换后余额</span>
                      <span className={`font-bold ${
                        (user?.points || 0) >= selectedProduct.points ? 'text-teal-600' : 'text-red-500'
                      }`}>
                        {(user?.points || 0) - selectedProduct.points}
                      </span>
                    </div>
                  </div>
                  
                  {(user?.points || 0) < selectedProduct.points && (
                    <p className="text-red-500 text-sm mt-3 text-center">积分不足，无法兑换</p>
                  )}
                </div>
                <div className="p-4 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={() => { setShowConfirmModal(false); setSelectedProduct(null); }}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleExchange}
                    disabled={exchanging || (user?.points || 0) < selectedProduct.points || selectedProduct.stock <= 0}
                    className="flex-1 bg-teal-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {exchanging ? <Loader2 className="animate-spin" size={18} /> : <ShoppingCart size={18} />}
                    确认兑换
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
