import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const AnalyticsView: React.FC = () => {
  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-800">数据分析看板</h2>
       
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Activity Chart */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-700 mb-6 border-l-4 border-teal-700 pl-3">本周活跃度趋势</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataActivity}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} />
                  <Legend />
                  <Bar dataKey="active" name="活跃用户" fill="#0f766e" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="view" name="浏览量" fill="#99f6e4" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* Topics Pie Chart */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-700 mb-6 border-l-4 border-teal-700 pl-3">热门话题分布</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataTopics}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataTopics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            </div>
         </div>
         
         {/* Line Chart */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <h3 className="font-bold text-gray-700 mb-6 border-l-4 border-teal-700 pl-3">内容发布与互动趋势</h3>
             <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dataActivity}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="active" name="互动数" stroke="#0f766e" strokeWidth={3} dot={{r: 4}} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="view" name="发布数" stroke="#ffc658" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
         </div>
       </div>
    </div>
  );
};