import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Filter, Search, ChevronLeft, ChevronRight, Grid, List, Loader2 } from 'lucide-react';
import { activitiesApi } from '../services/api';
import { SkeletonCard, SkeletonList } from '../components/Loading';

interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'event' | 'meeting' | 'workshop' | 'vote' | 'other';
  status: 'upcoming' | 'ongoing' | 'ended';
  startTime: string;
  endTime: string;
  location?: string;
  capacity?: number;
  registrations?: number;
  imageUrl?: string;
  isRegistered?: boolean;
}

interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  activities: Activity[];
}

export const ActivityView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [calendarActivities, setCalendarActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || '');
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (viewMode === 'list') {
      loadActivities();
    } else {
      loadCalendarActivities();
    }
  }, [viewMode, statusFilter, typeFilter, currentMonth, currentYear]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const response: any = await activitiesApi.list({
        status: statusFilter || undefined,
        page: 1,
        limit: 20
      });
      if (response.success) {
        let filtered = response.data.activities;
        if (typeFilter) {
          filtered = filtered.filter((a: Activity) => a.type === typeFilter);
        }
        setActivities(filtered);
      }
    } catch (error) {
      console.error('Load activities failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarActivities = async () => {
    setLoading(true);
    try {
      const response: any = await activitiesApi.getCalendar(currentMonth + 1, currentYear);
      if (response.success) {
        setCalendarActivities(response.data);
      }
    } catch (error) {
      console.error('Load calendar activities failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">即将开始</span>;
      case 'ongoing':
        return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">进行中</span>;
      case 'ended':
        return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs">已结束</span>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const types: Record<string, { bg: string; text: string; label: string }> = {
      event: { bg: 'bg-purple-100', text: 'text-purple-700', label: '活动' },
      meeting: { bg: 'bg-blue-100', text: 'text-blue-700', label: '会议' },
      workshop: { bg: 'bg-orange-100', text: 'text-orange-700', label: '培训' },
      vote: { bg: 'bg-pink-100', text: 'text-pink-700', label: '投票' },
      other: { bg: 'bg-gray-100', text: 'text-gray-700', label: '其他' },
    };
    const t = types[type] || types.other;
    return <span className={`${t.bg} ${t.text} px-2 py-0.5 rounded text-xs`}>{t.label}</span>;
  };

  // Calendar helpers
  const getCalendarDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startPadding = firstDay.getDay();
    
    // Previous month days
    const prevMonth = new Date(currentYear, currentMonth, 0);
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        month: currentMonth - 1,
        year: currentYear,
        isCurrentMonth: false,
        activities: []
      });
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dayActivities = calendarActivities.filter(a => {
        const start = new Date(a.startTime);
        return start.getDate() === i && start.getMonth() === currentMonth && start.getFullYear() === currentYear;
      });
      days.push({
        date: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
        activities: dayActivities
      });
    }
    
    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: i,
        month: currentMonth + 1,
        year: currentYear,
        isCurrentMonth: false,
        activities: []
      });
    }
    
    return days;
  };

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">活动专区</h1>
          <p className="text-sm text-gray-500 mt-1">丰富多彩的企业活动</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <List size={20} />
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'calendar' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <Calendar size={20} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            >
              <option value="">全部状态</option>
              <option value="upcoming">即将开始</option>
              <option value="ongoing">进行中</option>
              <option value="ended">已结束</option>
            </select>
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          >
            <option value="">全部类型</option>
            <option value="event">活动</option>
            <option value="meeting">会议</option>
            <option value="workshop">培训</option>
            <option value="vote">投票</option>
          </select>
        </div>
      </div>

      {viewMode === 'list' ? (
        /* List View */
        loading ? (
          <SkeletonList count={5} />
        ) : activities.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">暂无活动</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities.map(activity => (
              <Link
                key={activity.id}
                to={`/activities/${activity.id}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all group"
              >
                {activity.imageUrl && (
                  <div className="h-32 bg-gray-100">
                    <img src={activity.imageUrl} alt={activity.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeBadge(activity.type)}
                    {getStatusBadge(activity.status)}
                    {activity.isRegistered && (
                      <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded text-xs">已报名</span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-800 line-clamp-1 group-hover:text-teal-600 transition-colors">
                    {activity.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{activity.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(activity.startTime).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        /* Calendar View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <button
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear(currentYear - 1);
                } else {
                  setCurrentMonth(currentMonth - 1);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="font-bold text-gray-800">
              {currentYear}年 {monthNames[currentMonth]}
            </h3>
            <button
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear(currentYear + 1);
                } else {
                  setCurrentMonth(currentMonth + 1);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="animate-spin mx-auto text-teal-600" size={32} />
              <p className="text-gray-400 mt-2">加载中...</p>
            </div>
          ) : (
            <>
              {/* Day Names */}
              <div className="grid grid-cols-7 border-b border-gray-100">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {getCalendarDays().map((day, index) => {
                  const isToday = day.isCurrentMonth && 
                    day.date === new Date().getDate() && 
                    day.month === new Date().getMonth() &&
                    day.year === new Date().getFullYear();
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-24 p-2 border-b border-r border-gray-50 ${
                        !day.isCurrentMonth ? 'bg-gray-50/50' : ''
                      } ${isToday ? 'bg-teal-50/50' : ''}`}
                    >
                      <span className={`text-sm ${
                        !day.isCurrentMonth ? 'text-gray-300' : 
                        isToday ? 'text-teal-600 font-bold' : 'text-gray-700'
                      }`}>
                        {day.date}
                      </span>
                      <div className="mt-1 space-y-1">
                        {day.activities.slice(0, 2).map(activity => (
                          <Link
                            key={activity.id}
                            to={`/activities/${activity.id}`}
                            className="block text-[10px] bg-teal-100 text-teal-700 px-1 py-0.5 rounded truncate hover:bg-teal-200 transition-colors"
                          >
                            {activity.title}
                          </Link>
                        ))}
                        {day.activities.length > 2 && (
                          <span className="text-[10px] text-gray-400">
                            +{day.activities.length - 2} 更多
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
