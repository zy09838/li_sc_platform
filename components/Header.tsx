
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, ChevronDown, PenTool, Calendar, Heart, FileText, MessageSquare, UserPlus, Megaphone, Check, User, Settings, LogOut, Bookmark, ChevronRight, LayoutDashboard, Zap } from 'lucide-react';
import { NavTab } from '../types';
import { CURRENT_USER } from '../constants';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onSearch: (query: string) => void;
  onPublish: (type: 'article' | 'activity' | 'moment') => void;
}

const navItems = [
  { id: NavTab.HOME, label: '首页' },
  { id: NavTab.TRAINING, label: '知识' },
  { id: NavTab.AI_LAB, label: 'AI赋能' },
  { id: NavTab.ARTICLES, label: '发文' },
  { id: NavTab.ACTIVITY, label: '活动' },
  { id: NavTab.MOMENTS, label: '生活' },
  { id: NavTab.MALL, label: '积分商城' }
];

// Mock Notification Data
const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'like', content: '黄予涵 赞了你的文章《供应链感知新视界》', time: '10分钟前', isRead: false },
  { id: 2, type: 'comment', content: '李思思 评论了你的文章: "分析得很透彻，特别是关于..."', time: '1小时前', isRead: false },
  { id: 3, type: 'system', content: '系统通知: 您报名的“2026合作伙伴大会”审核已通过', time: '2小时前', isRead: true },
  { id: 4, type: 'follow', content: '张伟 关注了你', time: '昨天', isRead: true },
];

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onSearch, onPublish }) => {
  const [isPublishMenuOpen, setIsPublishMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPublishMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const handlePublishClick = (type: 'article' | 'activity' | 'moment') => {
    onPublish(type);
    setIsPublishMenuOpen(false);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'like': return <Heart size={14} className="text-red-500 fill-red-500" />;
      case 'comment': return <MessageSquare size={14} className="text-blue-500 fill-blue-500" />;
      case 'follow': return <UserPlus size={14} className="text-teal-500" />;
      case 'system': return <Megaphone size={14} className="text-orange-500" />;
      default: return <Bell size={14} />;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Nav */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab(NavTab.HOME)}>
            <div className="w-8 h-8 bg-teal-800 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
              理链
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight">Li-SC</span>
          </div>
          
          <nav className="flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id 
                    ? 'text-teal-800 bg-teal-50 font-bold' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Search and User Actions */}
        <div className="flex items-center gap-4">
          <div className="relative hidden lg:block group">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder="搜索知识库 / 唤起 AI..." 
              className="w-64 bg-gray-100 border-transparent focus:bg-white border focus:border-teal-500 rounded-full pl-10 pr-4 py-1.5 text-sm transition-all outline-none"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
          </div>

          {/* Publish Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsPublishMenuOpen(!isPublishMenuOpen)}
              className="bg-teal-700 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-teal-800 shadow-sm shadow-teal-200 flex items-center gap-2 transition-all active:scale-95"
            >
              <PenTool size={14} /> 发布 <ChevronDown size={14} className={`transition-transform duration-200 ${isPublishMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isPublishMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                 <button 
                   onClick={() => handlePublishClick('article')}
                   className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-3 transition-colors"
                 >
                    <FileText size={16} /> 写文章
                 </button>
                 <button 
                   onClick={() => handlePublishClick('activity')}
                   className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-3 transition-colors border-t border-gray-50"
                 >
                    <Calendar size={16} /> 发起活动
                 </button>
                 <button 
                   onClick={() => handlePublishClick('moment')}
                   className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-3 transition-colors border-t border-gray-50"
                 >
                    <Heart size={16} /> 许个愿
                 </button>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`relative p-2 rounded-full transition-colors ${isNotificationsOpen ? 'bg-teal-50 text-teal-700' : 'text-gray-400 hover:bg-gray-100'}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationsOpen && (
               <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                     <div className="flex items-center gap-2">
                       <h3 className="font-bold text-gray-800 text-sm">通知中心</h3>
                       {unreadCount > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded-full font-bold">{unreadCount}</span>}
                     </div>
                     {unreadCount > 0 && (
                       <button onClick={handleMarkAllRead} className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1">
                         <Check size={12} /> 全部已读
                       </button>
                     )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                     {notifications.length === 0 ? (
                       <div className="p-8 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                          <Bell size={24} className="opacity-20" />
                          暂无新通知
                       </div>
                     ) : (
                       notifications.map(n => (
                         <div
                           key={n.id}
                           onClick={() => handleNotificationClick(n.id)}
                           className={`p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${!n.isRead ? 'bg-teal-50/20' : ''}`}
                         >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-gray-100 bg-white shadow-sm text-gray-500">
                               {getNotificationIcon(n.type)}
                            </div>
                            <div className="flex-1">
                               <p className={`text-xs mb-1 line-clamp-2 leading-relaxed ${!n.isRead ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>
                                 {n.content}
                               </p>
                               <span className="text-[10px] text-gray-400">{n.time}</span>
                            </div>
                            {!n.isRead && (
                              <div className="self-center w-1.5 h-1.5 bg-red-500 rounded-full shrink-0"></div>
                            )}
                         </div>
                       ))
                     )}
                  </div>
                  <div className="p-2 border-t border-gray-50 text-center bg-gray-50/30">
                     <button className="text-xs text-gray-400 hover:text-gray-600 w-full py-1">查看全部通知</button>
                  </div>
               </div>
            )}
          </div>

          {/* Profile Avatar & Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)} 
              className="flex items-center gap-2 focus:outline-none"
            >
              <img 
                src={CURRENT_USER.avatar} 
                alt="User" 
                className={`w-8 h-8 rounded-full border border-gray-200 transition-all ${isProfileOpen ? 'ring-2 ring-teal-500 ring-offset-2' : 'hover:ring-2 hover:ring-teal-500 hover:ring-offset-2'}`} 
              />
            </button>

            {isProfileOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                  {/* User Info Header */}
                  <div className="p-4 bg-gradient-to-r from-teal-50 to-white border-b border-gray-100">
                      <div className="flex items-center gap-3 mb-4">
                          <img src={CURRENT_USER.avatar} alt="User" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                          <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900">{CURRENT_USER.name}</h3>
                                <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                                  <Zap size={8} fill="currentColor" /> LV.8
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">供应链管理部 / 计划专员</p>
                          </div>
                      </div>
                      <div className="flex justify-between text-center bg-white/60 p-2 rounded-lg border border-white/50">
                           <div className="flex-1 border-r border-gray-200/50">
                              <div className="font-bold text-gray-800 text-lg leading-tight">{CURRENT_USER.stats?.articles}</div>
                              <div className="text-[10px] text-gray-500">文章</div>
                           </div>
                           <div className="flex-1 border-r border-gray-200/50">
                              <div className="font-bold text-gray-800 text-lg leading-tight">{CURRENT_USER.stats?.likes}</div>
                              <div className="text-[10px] text-gray-500">获赞</div>
                           </div>
                           <div className="flex-1">
                              <div className="font-bold text-gray-800 text-lg leading-tight">1280</div>
                              <div className="text-[10px] text-gray-500">积分</div>
                           </div>
                      </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                      <button 
                        onClick={() => { setIsProfileOpen(false); setActiveTab(NavTab.ADMIN); }}
                        className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-teal-50 rounded-lg flex items-center gap-3 transition-colors group"
                      >
                          <div className="bg-teal-100 p-1.5 rounded-md text-teal-600">
                            <LayoutDashboard size={16} />
                          </div>
                          <span className="flex-1 font-bold text-teal-800">管理员后台</span>
                          <ChevronRight size={14} className="text-teal-300" />
                      </button>
                      <button className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors group">
                          <div className="bg-gray-100 p-1.5 rounded-md text-gray-500 group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors">
                            <User size={16} />
                          </div>
                          <span className="flex-1 font-medium">个人主页</span>
                          <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400" />
                      </button>
                      <button className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors group">
                          <div className="bg-gray-100 p-1.5 rounded-md text-gray-500 group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors">
                            <Bookmark size={16} />
                          </div>
                          <span className="flex-1 font-medium">我的收藏</span>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">12</span>
                      </button>
                      <button className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors group">
                          <div className="bg-gray-100 p-1.5 rounded-md text-gray-500 group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors">
                            <Settings size={16} />
                          </div>
                          <span className="flex-1 font-medium">账号设置</span>
                      </button>
                  </div>
                  
                  <div className="p-2 border-t border-gray-50 bg-gray-50/50">
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3 transition-colors">
                           <LogOut size={16} />
                           <span>退出登录</span>
                      </button>
                  </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
