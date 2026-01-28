import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Award, CheckCircle2, Zap, ListTodo, History, ArrowRight, X, TrendingUp, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { usersApi, tasksApi } from '../services/api';

interface Task {
  id: string;
  title: string;
  reward: number;
  type: string;
  isCompleted: boolean;
}

interface LeaderboardUser {
  id: string;
  name: string;
  avatarUrl?: string;
  points: number;
  rank: number;
  medal: string;
}

interface PointTransaction {
  id: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  createdAt: string;
}

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, checkin, updatePoints } = useAuthStore();
  
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showPointAnim, setShowPointAnim] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [pointHistory, setPointHistory] = useState<PointTransaction[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
      loadLeaderboard();
    }
  }, [isAuthenticated]);

  const loadTasks = async () => {
    try {
      const response: any = await tasksApi.list();
      if (response.success) {
        setTasks(response.data);
        // Check if already checked in today
        const checkinTask = response.data.find((t: Task) => t.type === 'checkin');
        if (checkinTask?.isCompleted) {
          setIsCheckedIn(true);
        }
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response: any = await usersApi.getLeaderboard(5);
      if (response.success) {
        setLeaderboard(response.data);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    }
  };

  const loadPointHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const response: any = await usersApi.getPoints(user.id, 1, 10);
      if (response.success) {
        setPointHistory(response.data.transactions);
      }
    } catch (error) {
      console.error('Failed to load point history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCheckIn = async () => {
    if (isCheckedIn || checkingIn || !isAuthenticated) return;
    
    setCheckingIn(true);
    try {
      const result = await checkin();
      setIsCheckedIn(true);
      setShowPointAnim(true);
      setTimeout(() => setShowPointAnim(false), 2000);
      
      // Update tasks
      setTasks(prev => prev.map(t => 
        t.type === 'checkin' ? { ...t, isCompleted: true } : t
      ));
    } catch (error: any) {
      if (error?.message?.includes('已签到')) {
        setIsCheckedIn(true);
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleOpenHistory = () => {
    setIsHistoryOpen(true);
    loadPointHistory();
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response: any = await tasksApi.complete(taskId);
      if (response.success) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, isCompleted: true } : t
        ));
        if (user && response.data?.reward) {
          updatePoints(user.points + response.data.reward);
        }
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 text-center">
        <p className="text-gray-500 mb-4">登录后查看更多内容</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-teal-700 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors"
        >
          立即登录
        </button>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '上午好';
    if (hour < 18) return '下午好';
    return '晚上好';
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
              {user?.name} {getGreeting()}!
            </h3>
            <div className="flex items-center gap-2 mt-2">
               <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                 <Zap size={10} fill="currentColor" /> LV.{Math.floor((user?.points || 0) / 500) + 1}
               </span>
               <button 
                onClick={handleOpenHistory}
                className="text-gray-400 text-xs hover:text-teal-600 flex items-center gap-1 transition-colors"
               >
                  积分: <span className="text-teal-600 font-bold">{user?.points || 0}</span>
                  <History size={10} />
               </button>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={handleCheckIn}
              disabled={isCheckedIn || checkingIn}
              className={`text-xs px-3 py-1.5 rounded transition-all shadow-md flex items-center gap-1 font-medium
                ${isCheckedIn 
                  ? 'bg-gray-100 text-green-600 border border-green-200 cursor-default' 
                  : 'bg-teal-700 hover:bg-teal-800 text-white active:scale-95 shadow-teal-200'}`}
            >
              {checkingIn ? (
                <Loader2 size={12} className="animate-spin" />
              ) : isCheckedIn ? (
                <><CheckCircle2 size={12} /> 已签到</>
              ) : (
                '签到'
              )}
            </button>
            {showPointAnim && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-orange-500 font-extrabold text-lg animate-bounce pointer-events-none whitespace-nowrap drop-shadow-sm">
                +10 积分
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-2 pt-3 border-t border-gray-50 flex justify-between items-center text-xs text-gray-500 relative z-10">
           <span>继续努力，升级在望！</span>
           <span className="text-[10px] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 text-gray-400">
             下一等级: {((Math.floor((user?.points || 0) / 500) + 1) * 500 - (user?.points || 0))} 分
           </span>
        </div>
      </div>

      {/* Task Center Module */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
         <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
               <ListTodo size={16} className="text-teal-600" /> 任务中心
            </h3>
            <span className="text-[10px] text-gray-400">
              今日完成 {tasks.filter(t => t.isCompleted).length}/{tasks.length}
            </span>
         </div>
         <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">暂无任务</p>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                     <div className={`w-1.5 h-1.5 rounded-full ${task.isCompleted ? 'bg-gray-200' : 'bg-teal-500'}`} />
                     <span className={`text-xs ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                       {task.title}
                     </span>
                  </div>
                  <div className="flex items-center gap-1">
                     <span className={`text-[10px] font-bold ${task.isCompleted ? 'text-gray-300' : 'text-orange-500'}`}>
                       +{task.reward}
                     </span>
                     {task.isCompleted ? (
                        <CheckCircle2 size={12} className="text-green-500" />
                     ) : (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          className="text-gray-300 group-hover:text-teal-500 transition-colors"
                        >
                          <ArrowRight size={10} />
                        </button>
                     )}
                  </div>
                </div>
              ))
            )}
         </div>
      </div>

      {/* Author Leaderboard */}
      <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">
           <Award size={16} className="text-yellow-500" /> 积分榜
        </h3>
        <div className="space-y-4">
          {leaderboard.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">暂无数据</p>
          ) : (
            leaderboard.map((u, index) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className={`w-5 h-5 flex items-center justify-center text-xs font-bold rounded ${
                  index === 0 ? 'bg-yellow-500 text-white' : 
                  index === 1 ? 'bg-gray-400 text-white' : 
                  index === 2 ? 'bg-orange-700 text-white' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <img 
                  src={u.avatarUrl || `https://picsum.photos/seed/${u.id}/50/50`} 
                  alt={u.name} 
                  className="w-8 h-8 rounded-full border border-gray-100" 
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">{u.name}</span>
                    <span className="text-xs text-teal-600 font-bold">{u.points} 分</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Point History Modal */}
      {isHistoryOpen && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-300">
               <div className="bg-teal-800 p-6 text-white">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-lg flex items-center gap-2">
                       <History size={20} /> 积分账单
                     </h3>
                     <button onClick={() => setIsHistoryOpen(false)}><X size={20} /></button>
                  </div>
                  <div className="flex items-end gap-2">
                     <span className="text-4xl font-mono font-bold">{user?.points || 0}</span>
                     <span className="text-xs opacity-80 mb-1.5">当前可用积分</span>
                  </div>
               </div>
               <div className="p-4 max-h-[400px] overflow-y-auto">
                  {loadingHistory ? (
                    <div className="text-center py-8">
                      <Loader2 className="animate-spin mx-auto text-teal-600" size={24} />
                      <p className="text-xs text-gray-400 mt-2">加载中...</p>
                    </div>
                  ) : pointHistory.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">暂无积分记录</p>
                  ) : (
                    pointHistory.map(item => (
                       <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                          <div>
                             <p className="text-sm font-bold text-gray-800">{item.reason}</p>
                             <p className="text-[10px] text-gray-400 mt-0.5">
                               {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                             </p>
                          </div>
                          <span className={`font-mono font-bold ${item.type === 'in' ? 'text-green-500' : 'text-red-500'}`}>
                             {item.type === 'in' ? '+' : '-'}{item.amount}
                          </span>
                       </div>
                    ))
                  )}
               </div>
               <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <button 
                    onClick={() => setIsHistoryOpen(false)}
                    className="w-full text-xs text-gray-500 font-medium py-2"
                  >
                     关闭
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
