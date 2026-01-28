
import React, { useState, useEffect } from 'react';
import { MOCK_ACTIVITIES } from '../constants';
import { MapPin, Calendar, Users, ArrowRight, CheckSquare, Plus, Search, ChevronLeft, ChevronRight, Activity as ActivityIcon } from 'lucide-react';
import { Activity } from '../types';

interface ActivityViewProps {
  activities: Activity[];
  onActivityClick?: (activity: Activity) => void;
  triggerCreate?: boolean;
}

export const ActivityView: React.FC<ActivityViewProps> = ({ activities, onActivityClick, triggerCreate }) => {
  // Calendar State (Default to 2026-03)
  const [calendarDate, setCalendarDate] = useState(new Date('2026-03-01'));

  const quarterlyActivity = activities.find(a => a.isQuarterly);
  const votingActivity = activities.find(a => a.hasVoting);
  const otherActivities = activities.filter(a => !a.isQuarterly && !a.hasVoting);

  // --- Calendar Logic ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const paddingDays = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth() + 1;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 text-sm">{year}年 {month}月</h3>
          <div className="flex gap-1">
             <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500"><ChevronLeft size={16} /></button>
             <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className="text-xs text-gray-400 font-medium py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {paddingDays.map(i => <div key={`pad-${i}`} className="aspect-square" />)}
          {days.map(day => {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayActivities = activities.filter(a => a.date === dateStr);
            const isToday = new Date().toDateString() === new Date(year, month - 1, day).toDateString();
            return (
              <div key={day} className={`aspect-square rounded-lg flex flex-col items-center justify-center relative cursor-pointer hover:bg-teal-50 transition-colors group ${isToday ? 'bg-blue-50 font-bold text-blue-600' : 'text-gray-700'}`}>
                <span className="text-xs z-10 relative">{day}</span>
                <div className="flex gap-0.5 mt-0.5 absolute bottom-1.5">
                  {dayActivities.slice(0, 3).map((act, idx) => (
                    <div key={idx} className={`w-1 h-1 rounded-full ${act.status === 'Upcoming' ? 'bg-green-500' : act.status === 'Ongoing' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  ))}
                </div>
                {dayActivities.length > 0 && (
                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20">
                      {dayActivities.map(a => <div key={a.id} className="truncate mb-0.5 last:mb-0">• {a.title}</div>)}
                   </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 justify-center mt-4 pt-3 border-t border-gray-50 text-[10px] text-gray-500">
           <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> 报名中</div>
           <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> 进行中</div>
           <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div> 已结束</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
           <div>
             <h2 className="text-2xl font-bold text-gray-800">活动专区</h2>
             <p className="text-gray-500 text-sm">参与精彩活动，共建活力社区</p>
           </div>
           <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
              <span className="flex items-center gap-1"><Calendar size={14}/> 发现 <b>{activities.length}</b> 个新计划</span>
           </div>
       </div>

       {quarterlyActivity && (
         <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group">
            <div className="bg-gray-900 h-48 relative cursor-pointer" onClick={() => onActivityClick && onActivityClick(quarterlyActivity)}>
               <img src={quarterlyActivity.image} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-700" alt="Quarterly" />
               <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4">
                  <span className="bg-yellow-500 text-gray-900 text-xs font-bold px-2 py-0.5 rounded mb-2 shadow-sm">季度重磅</span>
                  <h3 className="text-3xl font-bold mb-2 tracking-tight shadow-sm">{quarterlyActivity.title}</h3>
                  <div className="flex items-center gap-4 text-sm opacity-90 shadow-sm">
                    <span className="flex items-center gap-1"><Calendar size={14}/> {quarterlyActivity.date}</span>
                    <span className="flex items-center gap-1"><MapPin size={14}/> {quarterlyActivity.location}</span>
                  </div>
               </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">
               <div className="text-center px-4">
                 <h4 className="font-bold text-gray-800 mb-2">会议议程</h4>
                 <p className="text-xs text-gray-500 mb-3">查看详细的会议流程与嘉宾介绍</p>
                 <button onClick={() => onActivityClick && onActivityClick(quarterlyActivity)} className="text-teal-600 text-sm font-medium hover:underline">查看详情</button>
               </div>
               <div className="text-center px-4 pt-4 md:pt-0">
                 <h4 className="font-bold text-gray-800 mb-2">立即报名</h4>
                 <p className="text-xs text-gray-500 mb-3">剩余名额: {150 - quarterlyActivity.participants} / 150</p>
                 <button onClick={() => onActivityClick && onActivityClick(quarterlyActivity)} className="bg-teal-700 text-white text-xs px-4 py-1.5 rounded hover:bg-teal-800 transition-colors">
                   {quarterlyActivity.isRegistered ? '查看报名' : '点击报名'}
                 </button>
               </div>
               <div className="text-center px-4 pt-4 md:pt-0">
                 <h4 className="font-bold text-gray-800 mb-2">现场互动</h4>
                 <p className="text-xs text-gray-500 mb-3">参与投票与抽奖环节</p>
                 <button className="text-teal-600 text-sm font-medium hover:underline">进入互动区</button>
               </div>
            </div>
         </div>
       )}

       {votingActivity && (
         <div onClick={() => onActivityClick && onActivityClick(votingActivity)} className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group">
            <div className="flex items-start gap-4">
               <div className="bg-indigo-100 p-2.5 rounded-lg text-indigo-600 mt-1 group-hover:bg-indigo-200 transition-colors"><CheckSquare size={24} /></div>
               <div>
                 <h4 className="font-bold text-indigo-900 mb-1">{votingActivity.title}</h4>
                 <p className="text-indigo-600/70 text-sm">截止日期：{votingActivity.date} • {votingActivity.participants} 人已参与</p>
               </div>
            </div>
            <button className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition-colors">参与投票</button>
         </div>
       )}

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
            <h3 className="font-bold text-gray-800 mb-4 border-l-4 border-teal-700 pl-3">精彩活动回顾 & 预告</h3>
            <div className="grid grid-cols-1 gap-6">
              {otherActivities.map(act => (
                <div key={act.id} onClick={() => onActivityClick && onActivityClick(act)} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row gap-5 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="sm:w-48 h-32 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                    <img src={act.image} alt={act.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                       <div className="flex justify-between items-start mb-2">
                         <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${act.status === 'Upcoming' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{act.status === 'Upcoming' ? '报名中' : act.status}</span>
                       </div>
                       <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-teal-700 transition-colors">{act.title}</h3>
                       <div className="flex items-center gap-4 text-xs text-gray-500">
                         <span className="flex items-center gap-1"><Calendar size={12} /> {act.date}</span>
                         <span className="flex items-center gap-1"><MapPin size={12} /> {act.location}</span>
                         <span className="flex items-center gap-1"><Users size={12} /> {act.participants} 人已报名</span>
                       </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                       <button className="text-sm font-medium text-gray-500 group-hover:text-teal-700 flex items-center gap-1 transition-colors">了解详情 <ArrowRight size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
         </div>
         <div className="space-y-6">
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg p-5 border border-teal-100">
                <h3 className="font-bold text-teal-900 mb-2 text-sm flex items-center gap-2"><ActivityIcon size={16} /> 活动日历</h3>
                <p className="text-xs text-teal-700 mb-4 opacity-80">查看近期活动安排，不错过每一场精彩。</p>
                {renderCalendar()}
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
               <h3 className="font-bold text-gray-800 mb-3 text-sm">热门标签</h3>
               <div className="flex flex-wrap gap-2">
                  {['全部', '技能培训', '圆桌论坛', '团建聚会', '公益活动', '高层见面会'].map(tag => (
                    <button key={tag} className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-full hover:bg-teal-50 hover:text-teal-700 transition-colors">{tag}</button>
                  ))}
               </div>
            </div>
         </div>
       </div>
    </div>
  );
};
