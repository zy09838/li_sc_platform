
import React, { useState } from 'react';
import { Calendar, Award, ThumbsUp, CheckCircle2, Zap, ListTodo, History, ArrowRight, X, TrendingUp } from 'lucide-react';
import { CURRENT_USER, LEADERBOARD_USERS, MOCK_TASKS, MOCK_POINT_HISTORY } from '../constants';
import { User, Task, PointTransaction } from '../types';

interface SidebarProps {
  user?: User;
  userPoints: number;
  onCheckIn: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user = CURRENT_USER, userPoints, onCheckIn }) => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showPointAnim, setShowPointAnim] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleCheckInClick = () => {
    if (isCheckedIn) return;
    setIsCheckedIn(true);
    onCheckIn(); 
    setShowPointAnim(true);
    setTimeout(() => setShowPointAnim(false), 2000);
    
    // Update tasks list if check-in is a task
    setTasks(prev => prev.map(t => t.type === 'checkin' ? { ...t, isCompleted: true } : t));
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500 delay-100">
      {/* User Card */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Calendar size={100} />
        </div>
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <h3 className="text-gray-800 font-medium flex items-center gap-2">
              <span className="w-4 h-4 bg-teal-700 rounded-sm inline-block"></span>
              {user.name} 下午好!
            </h3>
            <div className="flex items-center gap-2 mt-2">
               <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                 <Zap size={10} fill="currentColor" /> LV.8
               </span>
               <button 
                onClick={() => setIsHistoryOpen(true)}
                className="text-gray-400 text-xs hover:text-teal-600 flex items-center gap-1 transition-colors"
               >
                  积分: <span className="text-teal-600 font-bold">{userPoints}</span>
                  <History size={10} />
               </button>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={handleCheckInClick}
              disabled={isCheckedIn}
              className={`text-xs px-3 py-1.5 rounded transition-all shadow-md flex items-center gap-1 font-medium
                ${isCheckedIn 
                  ? 'bg-gray-100 text-green-600 border border-green-200 cursor-default' 
                  : 'bg-teal-700 hover:bg-teal-800 text-white active:scale-95 shadow-teal-200'}`}
            >
              {isCheckedIn ? <><CheckCircle2 size={12} /> 已签到</> : '签到'}
            </button>
            {showPointAnim && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-orange-500 font-extrabold text-lg animate-bounce pointer-events-none whitespace-nowrap drop-shadow-sm">
                +10 积分
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-2 pt-3 border-t border-gray-50 flex justify-between items-center text-xs text-gray-500 relative z-10">
           <span>已连续签到 <b className="text-teal-600">12</b> 天</span>
           <span className="text-[10px] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 text-gray-400">明日 +15</span>
        </div>
      </div>

      {/* Task Center Module */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
               <ListTodo size={16} className="text-teal-600" /> 任务中心
            </h3>
            <span className="text-[10px] text-gray-400">今日完成 {tasks.filter(t=>t.isCompleted).length}/{tasks.length}</span>
         </div>
         <div className="space-y-3">
            {tasks.map(task => (
               <div key={task.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                     <div className={`w-1.5 h-1.5 rounded-full ${task.isCompleted ? 'bg-gray-200' : 'bg-teal-500'}`} />
                     <span className={`text-xs ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-600'}`}>{task.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                     <span className={`text-[10px] font-bold ${task.isCompleted ? 'text-gray-300' : 'text-orange-500'}`}>+{task.reward}</span>
                     {task.isCompleted ? (
                        <CheckCircle2 size={12} className="text-green-500" />
                     ) : (
                        <ArrowRight size={10} className="text-gray-300 group-hover:text-teal-500 transition-colors" />
                     )}
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Author Leaderboard */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">
           <Award size={16} className="text-yellow-500" /> 作者榜
        </h3>
        <div className="space-y-4">
          {LEADERBOARD_USERS.map((u, index) => (
            <div key={u.id} className="flex items-center gap-3">
              <div className={`w-5 h-5 flex items-center justify-center text-xs font-bold rounded ${
                index === 0 ? 'bg-yellow-500 text-white' : 
                index === 1 ? 'bg-gray-400 text-white' : 
                'bg-orange-700 text-white'
              }`}>
                {index + 1}
              </div>
              <img src={`https://picsum.photos/seed/${u.id}/50/50`} alt={u.name} className="w-8 h-8 rounded-full border border-gray-100" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{u.name}</span>
                  <span className="text-xs text-gray-400">{10 - index} 赞</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Point History Modal */}
      {isHistoryOpen && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-300">
               <div className="bg-teal-800 p-6 text-white">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-lg flex items-center gap-2"><History size={20} /> 积分账单</h3>
                     <button onClick={() => setIsHistoryOpen(false)}><X size={20} /></button>
                  </div>
                  <div className="flex items-end gap-2">
                     <span className="text-4xl font-mono font-bold">{userPoints}</span>
                     <span className="text-xs opacity-80 mb-1.5">当前可用积分</span>
                  </div>
               </div>
               <div className="p-4 max-h-[400px] overflow-y-auto">
                  {MOCK_POINT_HISTORY.map(item => (
                     <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                        <div>
                           <p className="text-sm font-bold text-gray-800">{item.reason}</p>
                           <p className="text-[10px] text-gray-400 mt-0.5">{item.date}</p>
                        </div>
                        <span className={`font-mono font-bold ${item.type === 'in' ? 'text-green-500' : 'text-red-500'}`}>
                           {item.type === 'in' ? '+' : '-'}{item.amount}
                        </span>
                     </div>
                  ))}
               </div>
               <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <button className="w-full text-xs text-teal-700 font-bold py-2 flex items-center justify-center gap-1">
                     查看更多详细明细 <ArrowRight size={12} />
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
