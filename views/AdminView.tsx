
import React, { useState } from 'react';
import { LayoutGrid, List, BarChart3, Search, Plus, FileSpreadsheet, Edit, Trash2, X, Users, Calendar, ArrowLeft } from 'lucide-react';
import { Activity, NavTab } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface AdminViewProps {
  activities: Activity[];
  onActivitiesChange: (newActivities: Activity[]) => void;
  onNavigate: (tab: NavTab) => void;
}

// Mock Analytics Data
const dataActivity = [
  { name: 'Mon', view: 4000, active: 2400 },
  { name: 'Tue', view: 3000, active: 1398 },
  { name: 'Wed', view: 2000, active: 9800 },
  { name: 'Thu', view: 2780, active: 3908 },
  { name: 'Fri', view: 1890, active: 4800 },
  { name: 'Sat', view: 2390, active: 3800 },
  { name: 'Sun', view: 3490, active: 4300 },
];

const dataTopics = [
  { name: '供应链战略', value: 400 },
  { name: '采购谈判', value: 300 },
  { name: '库存优化', value: 300 },
  { name: '数字化', value: 200 },
];

const COLORS = ['#0f766e', '#14b8a6', '#f59e0b', '#ef4444'];

export const AdminView: React.FC<AdminViewProps> = ({ activities, onActivitiesChange, onNavigate }) => {
  const [adminView, setAdminView] = useState<'list' | 'analytics'>('list');
  const [adminSearch, setAdminSearch] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    location: '',
    description: ''
  });

  const filteredAdminActivities = activities.filter(a => 
    a.title.toLowerCase().includes(adminSearch.toLowerCase()) || 
    a.location.toLowerCase().includes(adminSearch.toLowerCase())
  );

  const totalParticipants = activities.reduce((acc, curr) => acc + curr.participants, 0);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ title: '', date: '', location: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (activity: Activity) => {
    setEditingId(activity.id);
    setFormData({
      title: activity.title,
      date: activity.date,
      location: activity.location,
      description: activity.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个活动吗？')) {
      onActivitiesChange(activities.filter(a => a.id !== id));
    }
  };

  const handleExport = () => {
    alert('正在生成活动名单 Excel 表格...');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onActivitiesChange(activities.map(a => a.id === editingId ? { ...a, ...formData } : a));
    } else {
      const newAct: Activity = {
        id: Date.now().toString(),
        ...formData,
        status: 'Upcoming',
        participants: 1,
        image: `https://picsum.photos/seed/${Date.now()}/400/200`
      };
      onActivitiesChange([newAct, ...activities]);
    }
    setIsModalOpen(false);
  };

  const renderAdminActivityList = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">活动总数</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{activities.length}</h3>
                </div>
                <div className="bg-teal-50 text-teal-600 p-3 rounded-xl"><List size={24} /></div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">累计报名人数</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalParticipants}</h3>
                </div>
                <div className="bg-orange-50 text-orange-600 p-3 rounded-xl"><Users size={24} /></div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">进行中活动</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{activities.filter(a => a.status !== 'Ended').length}</h3>
                </div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-xl"><Calendar size={24} /></div>
            </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-wrap justify-between items-center gap-4">
                <h3 className="font-bold text-gray-800">所有活动明细</h3>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            value={adminSearch}
                            onChange={(e) => setAdminSearch(e.target.value)}
                            placeholder="搜索活动主题..." 
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none w-64"
                        />
                    </div>
                    <button onClick={handleOpenCreate} className="bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-800 flex items-center gap-2 transition-colors">
                        <Plus size={16} /> 新建活动
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">活动名称</th>
                            <th className="px-6 py-4">状态</th>
                            <th className="px-6 py-4">时间与地点</th>
                            <th className="px-6 py-4">报名情况</th>
                            <th className="px-6 py-4 text-right">管理</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredAdminActivities.map(activity => (
                            <tr key={activity.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-800 text-sm">{activity.title}</div>
                                    {activity.isQuarterly && <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 rounded-full mt-1 inline-block">季度重点</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold
                                        ${activity.status === 'Upcoming' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {activity.status === 'Upcoming' ? '已发布' : '已结束'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-xs text-gray-700">{activity.date}</div>
                                    <div className="text-[10px] text-gray-400 mt-1">{activity.location}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-teal-600" style={{ width: `${Math.min(100, activity.participants)}%` }}></div>
                                        </div>
                                        <span className="text-xs text-gray-600 font-mono font-bold">{activity.participants}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button onClick={handleExport} className="p-1.5 text-gray-400 hover:text-teal-600 transition-colors"><FileSpreadsheet size={16}/></button>
                                        <button onClick={() => handleOpenEdit(activity)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"><Edit size={16}/></button>
                                        <button onClick={() => handleDelete(activity.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );

  const renderAdminAnalytics = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-700 mb-6 border-l-4 border-teal-700 pl-3 text-sm">用户活跃趋势 (每周)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataActivity}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                            <YAxis axisLine={false} tickLine={false} fontSize={10} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            <Bar dataKey="active" name="活跃数" fill="#0f766e" radius={[4, 4, 0, 0]} barSize={15} />
                            <Bar dataKey="view" name="PV" fill="#ccfbf1" radius={[4, 4, 0, 0]} barSize={15} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-700 mb-6 border-l-4 border-teal-700 pl-3 text-sm">热门话题互动分布</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={dataTopics} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {dataTopics.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                <h3 className="font-bold text-gray-700 mb-6 border-l-4 border-teal-700 pl-3 text-sm">内容质量及互动走势</h3>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dataActivity}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                            <YAxis axisLine={false} tickLine={false} fontSize={10} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            <Line type="monotone" dataKey="active" name="点赞/评论" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="view" name="总发文" stroke="#f59e0b" strokeDasharray="5 5" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button 
                  onClick={() => onNavigate(NavTab.HOME)} 
                  className="bg-white p-2 rounded-full border border-gray-200 text-gray-400 hover:text-teal-600 transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">管理员后台</h2>
                    <p className="text-sm text-gray-400">统一管理社区活动、内容及运营数据分析</p>
                </div>
            </div>
            <div className="bg-teal-700/5 px-4 py-2 rounded-full border border-teal-100 text-teal-700 text-sm font-bold flex items-center gap-2">
                <LayoutGrid size={16} /> 理想汽车 Li-SC 数字化中心
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-56 bg-white rounded-2xl border border-gray-100 p-3 shadow-sm flex flex-col gap-1 shrink-0 h-fit sticky top-24">
                <button 
                    onClick={() => setAdminView('list')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                        ${adminView === 'list' ? 'bg-teal-700 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <List size={18} /> 活动管理
                </button>
                <button 
                    onClick={() => setAdminView('analytics')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                        ${adminView === 'analytics' ? 'bg-teal-700 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <BarChart3 size={18} /> 运营数据
                </button>
                <div className="h-px bg-gray-50 my-2"></div>
                <button onClick={() => onNavigate(NavTab.HOME)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 transition-colors">
                   <ArrowLeft size={18} /> 退出管理模式
                </button>
            </div>

            <div className="flex-1">
                {adminView === 'list' ? renderAdminActivityList() : renderAdminAnalytics()}
            </div>
        </div>

        {/* Create/Edit Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-800">{editingId ? '编辑活动详情' : '策划新活动'}</h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-8 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">活动主题</label>
                            <input 
                                type="text" 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                placeholder="请输入吸引人的活动标题"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">日期</label>
                                <input 
                                    type="date" 
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">地点</label>
                                <input 
                                    type="text" 
                                    value={formData.location}
                                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                    placeholder="如：L9 办公室"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">活动简介</label>
                            <textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm h-32 resize-none focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                                placeholder="详细描述活动内容与亮点..."
                            />
                        </div>
                        <div className="pt-6 flex gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">取消</button>
                            <button type="submit" className="flex-[2] py-3 bg-teal-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-700/20 hover:bg-teal-800 transition-all active:scale-95">
                                {editingId ? '保存更改' : '立即发布'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
