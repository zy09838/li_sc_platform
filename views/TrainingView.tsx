
import React, { useState } from 'react';
import { MOCK_COURSES, MOCK_KNOWLEDGE_DOCS, LEADERBOARD_USERS, MOCK_LEARNING_PATHS } from '../constants';
import { PlayCircle, Clock, BookOpen, Download, FileText, Award, Folder, File, FileSpreadsheet, FileBarChart, Monitor, LayoutTemplate, Scale, ClipboardList, UploadCloud, Search, Filter, Compass, ChevronRight, X, ExternalLink, Share2, Info } from 'lucide-react';
import { KnowledgeDoc, LearningPath } from '../types';

type SubTab = 'recommend' | 'courses' | 'knowledge';

export const TrainingView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('recommend');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [docSearch, setDocSearch] = useState('');
  const [previewDoc, setPreviewDoc] = useState<KnowledgeDoc | null>(null);

  const KNOWLEDGE_CATEGORIES = [
    { id: 'SOP', name: '标准作业程序 (SOP)', icon: ClipboardList, count: 12 },
    { id: 'Policy', name: '管理制度', icon: Scale, count: 8 },
    { id: 'Report', name: '研报与白皮书', icon: FileBarChart, count: 24 },
    { id: 'Template', name: '常用模板', icon: LayoutTemplate, count: 15 },
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="text-red-500" size={20} />;
      case 'ppt': return <Monitor className="text-orange-500" size={20} />;
      case 'excel': return <FileSpreadsheet className="text-green-500" size={20} />;
      case 'word': return <FileText className="text-blue-500" size={20} />;
      default: return <File className="text-gray-400" size={20} />;
    }
  };

  const filteredDocs = MOCK_KNOWLEDGE_DOCS.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(docSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || doc.category.includes(selectedCategory === 'SOP' ? 'SOP' : selectedCategory === 'Policy' ? '管理制度' : selectedCategory === 'Report' ? '研报' : '模板');
    return matchesSearch && matchesCategory;
  });

  // --- Sub Views ---

  const renderRecommend = () => (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex-1 space-y-6">
        {/* Professional Learning Paths */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-800 border-l-4 border-teal-700 pl-3">专家成长路径</h3>
              <button className="text-teal-600 text-xs font-bold flex items-center gap-1">探索全部路径 <ChevronRight size={14}/></button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MOCK_LEARNING_PATHS.map(path => (
                 <div key={path.id} className="border border-gray-100 rounded-xl p-4 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group bg-gray-50/50">
                    <div className="text-2xl mb-3">{path.icon}</div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-teal-700">{path.title}</h4>
                    <p className="text-[10px] text-gray-500 line-clamp-2 mb-3 leading-relaxed">{path.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                       <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-gray-100 text-gray-400">{path.stepsCount} 环节</span>
                       <span className={`text-[10px] font-bold ${path.level === 'Expert' ? 'text-purple-600' : path.level === 'Advanced' ? 'text-blue-600' : 'text-green-600'}`}>
                          {path.level === 'Expert' ? '专家级' : path.level === 'Advanced' ? '高级' : '入门'}
                       </span>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Featured Courses */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800 border-l-4 border-teal-700 pl-3">热门课程</h3>
            <button onClick={() => setActiveSubTab('courses')} className="text-gray-400 text-sm hover:text-teal-700">查看全部 &gt;</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MOCK_COURSES.slice(0, 2).map(course => (
              <div key={course.id} className="group border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                <div className="relative h-32 overflow-hidden">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle size={32} className="text-white" />
                  </div>
                </div>
                <div className="p-3">
                   <h4 className="font-bold text-gray-800 text-sm group-hover:text-teal-700 transition-colors line-clamp-1">{course.title}</h4>
                   <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-2">
                     <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                       <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
                     </div>
                     <span>{course.progress}%</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Stats */}
      <div className="lg:w-80 space-y-6">
         <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
               <Award className="text-yellow-500" size={18} /> 学霸榜
            </h3>
            <div className="space-y-4">
               {LEADERBOARD_USERS.slice(0, 5).map((user, idx) => (
                  <div key={user.id} className="flex items-center gap-3">
                     <span className={`w-5 h-5 flex items-center justify-center text-xs font-bold rounded 
                        ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}`}>
                        {idx + 1}
                     </span>
                     <div className="flex-1">
                        <div className="flex justify-between items-center">
                           <span className="text-sm font-medium text-gray-700">{user.name}</span>
                           <span className="text-xs font-bold text-teal-600">{user.score} hrs</span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full mt-1">
                           <div className="h-1 bg-teal-500 rounded-full" style={{ width: `${Math.min(100, (user.score / 1500) * 100)}%` }}></div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
         
         <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg p-5 border border-teal-100">
             <h3 className="font-bold text-teal-900 mb-3 text-sm">知识共建</h3>
             <p className="text-xs text-teal-700 mb-4">分享您的经验文档，每被下载一次可获得 2 积分。</p>
             <button className="w-full bg-teal-700 text-white py-2 rounded-lg text-sm font-bold hover:bg-teal-800 transition-colors flex items-center justify-center gap-2">
                <UploadCloud size={16} /> 上传文档
             </button>
         </div>
      </div>
    </div>
  );

  // Fix: Removed duplicate declaration of renderCourses
  const renderCourses = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap gap-2 mb-6">
             {['全部', '专业课程', '实战赋能', '前沿趋势', '通用力'].map(cat => (
               <button key={cat} className="px-3 py-1 text-sm rounded-full bg-gray-50 text-gray-600 hover:bg-teal-50 hover:text-teal-700 transition-colors">
                 {cat}
               </button>
             ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_COURSES.map(course => (
              <div key={course.id} className="group border border-gray-100 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
                <div className="relative h-40 overflow-hidden">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle size={40} className="text-white" />
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                    <Clock size={10} /> {course.duration}
                  </span>
                </div>
                <div className="p-4">
                   <div className="flex justify-between items-start mb-2"><span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{course.category}</span></div>
                   <h4 className="font-bold text-gray-800 mb-2 text-base group-hover:text-teal-700 transition-colors line-clamp-1">{course.title}</h4>
                   <p className="text-xs text-gray-500 mb-3">讲师：{course.instructor}</p>
                   <div className="flex items-center gap-2 text-[10px] text-gray-500">
                     <div className="flex-1 bg-gray-100 rounded-full h-1.5"><div className="bg-teal-600 h-1.5 rounded-full" style={{ width: `${course.progress}%` }}></div></div>
                     <span>{course.progress}%</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );

  // Fix: Removed duplicate declaration of renderKnowledgeBase
  const renderKnowledgeBase = () => (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)] min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-300">
       <div className="w-full md:w-64 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-50"><h3 className="font-bold text-gray-800 flex items-center gap-2"><Folder size={18} className="text-teal-600" /> 知识分类</h3></div>
          <div className="p-2 flex-1 overflow-y-auto">
             <button onClick={() => setSelectedCategory('All')} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 flex items-center justify-between transition-colors ${selectedCategory === 'All' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                <div className="flex items-center gap-2"><LayoutTemplate size={16} /> 全部文档</div>
                <span className="text-xs bg-gray-100 px-1.5 rounded-full text-gray-500">{MOCK_KNOWLEDGE_DOCS.length}</span>
             </button>
             <div className="my-2 border-t border-gray-100"></div>
             {KNOWLEDGE_CATEGORIES.map(cat => (
               <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 flex items-center justify-between transition-colors ${selectedCategory === cat.id ? 'bg-teal-50 text-teal-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2"><cat.icon size={16} /> {cat.name}</div>
                  <span className="text-xs bg-gray-100 px-1.5 rounded-full text-gray-500">{cat.count}</span>
               </button>
             ))}
          </div>
       </div>
       <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center">
             <div className="flex items-center gap-2 text-gray-800 font-bold">{selectedCategory === 'All' ? '全部文档' : KNOWLEDGE_CATEGORIES.find(c => c.id === selectedCategory)?.name}</div>
             <div className="flex gap-3">
                <div className="relative">
                   <input type="text" placeholder="搜索文档..." value={docSearch} onChange={(e) => setDocSearch(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none w-64" />
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
                <button className="bg-teal-700 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-teal-800 flex items-center gap-2 transition-colors"><UploadCloud size={14} /> 上传</button>
             </div>
          </div>
          <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 grid grid-cols-12 text-xs font-bold text-gray-500">
             <div className="col-span-6">文档名称</div><div className="col-span-2">分类</div><div className="col-span-2 text-right">大小 / 格式</div><div className="col-span-2 text-right">操作</div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
             {filteredDocs.map(doc => (
               <div key={doc.id} className="grid grid-cols-12 items-center px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors group border-b border-gray-50 last:border-0">
                  <div className="col-span-6 flex items-center gap-3">
                     <div className="bg-gray-100 p-2 rounded-lg text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all cursor-pointer" onClick={() => setPreviewDoc(doc)}>{getFileIcon(doc.type)}</div>
                     <div className="cursor-pointer" onClick={() => setPreviewDoc(doc)}>
                        <h4 className="text-sm font-medium text-gray-800 group-hover:text-teal-700 transition-colors mb-0.5">{doc.title}</h4>
                        <div className="text-[10px] text-gray-400 flex gap-2"><span>上传者: {doc.uploader}</span><span>• {doc.uploadDate}</span></div>
                     </div>
                  </div>
                  <div className="col-span-2"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{doc.category.split(' ')[0]}</span></div>
                  <div className="col-span-2 text-xs text-gray-500 text-right">{doc.size} <span className="uppercase text-gray-300 ml-1">{doc.type}</span></div>
                  <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded" title="预览" onClick={() => setPreviewDoc(doc)}><ExternalLink size={16} /></button>
                     <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="下载"><Download size={16} /></button>
                  </div>
               </div>
             ))}
          </div>
       </div>

       {/* Document Preview Modal (Mock Reader) */}
       {previewDoc && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
             <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded">{getFileIcon(previewDoc.type)}</div>
                      <div>
                         <h3 className="font-bold text-sm">{previewDoc.title}</h3>
                         <p className="text-[10px] opacity-60">Li-SC 内部知识资产 • 严禁外传</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Share2 size={18}/></button>
                      <button className="flex items-center gap-2 bg-teal-600 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors"><Download size={16}/> 下载文档</button>
                      <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={18}/></button>
                   </div>
                </div>
                <div className="flex-1 flex overflow-hidden">
                   {/* Left Outline/Meta */}
                   <div className="w-72 border-r border-gray-100 bg-gray-50 p-6 overflow-y-auto hidden lg:block">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">文档大纲</h4>
                      <div className="space-y-4">
                         {['第一章：行业背景与趋势分析', '第二章：理想汽车核心竞争力', '第三章：供应链数字化蓝图', '第四章：风险防控与协同体系', '附件：相关 SOP 与指标定义'].map((item, i) => (
                            <div key={i} className={`text-sm py-1.5 border-l-2 pl-3 transition-colors cursor-pointer ${i === 0 ? 'border-teal-600 text-teal-800 font-bold' : 'border-transparent text-gray-500 hover:text-teal-600 hover:border-teal-300'}`}>
                               {item}
                            </div>
                         ))}
                      </div>
                      <div className="mt-12 p-4 bg-blue-50 rounded-xl border border-blue-100">
                         <div className="flex items-center gap-2 text-blue-700 mb-2 font-bold text-xs"><Info size={14}/> 文档信息</div>
                         <div className="text-[10px] text-blue-600 space-y-1 opacity-80">
                            <p>页数：32 页</p>
                            <p>字数：12,450 字</p>
                            <p>状态：已生效 (V2.1)</p>
                         </div>
                      </div>
                   </div>
                   {/* Main Viewer Area (Mock content) */}
                   <div className="flex-1 bg-gray-200 p-8 overflow-y-auto">
                      <div className="max-w-3xl mx-auto bg-white shadow-lg p-16 min-h-[1200px] relative">
                         {/* Watermark */}
                         <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none rotate-45 text-4xl font-black text-gray-900">
                            朱岩滨 2026-03-01 <br/> INTERNAL ONLY
                         </div>
                         <h1 className="text-3xl font-bold text-center mb-12">{previewDoc.title.replace(/\.[^/.]+$/, "")}</h1>
                         <div className="space-y-6 text-gray-700 leading-8 text-justify">
                            <p className="font-bold text-gray-900 text-lg">一、前言</p>
                            <p>{previewDoc.description || '暂无内容简介，正在加载正文预览...'}</p>
                            <p>随着全球汽车产业链的深度重构，供应链的稳定与高效已成为理想汽车最核心的护城河。本指南旨在规范供应商准入流程，提升资源获取的透明度与质量水平。通过数字化的审核模型，我们能够更精准地评估潜在合作伙伴的技术潜能与交付可靠性。</p>
                            <div className="h-64 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center text-gray-400 italic">
                               [ 模拟图表：2025年供应链风险热力图 ]
                            </div>
                            <p>在过去的三个季度中，我们持续优化了二级供应商的穿透式管理，实现了关键原材料库存周转率提升15%的目标。下阶段的重点将聚焦在“碳足迹追踪”与“跨境物流协同”两大领域。</p>
                            <p className="pt-20 text-center text-gray-300">--- 预览仅展示前三页，完整内容请点击下载 ---</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 to-teal-900 rounded-2xl p-8 text-white flex justify-between items-end shadow-md relative overflow-hidden">
        <div className="relative z-10">
           <h2 className="text-3xl font-bold mb-2 tracking-tight">知识中心</h2>
           <p className="text-teal-100 opacity-90 text-sm max-w-lg">融合在线教育与业务知识库，为您提供一站式学习成长平台。在这里，您可以学习专业课程，查阅业务SOP，下载常用模板。</p>
        </div>
        <div className="hidden md:block relative z-10">
            <BookOpen size={64} className="opacity-10 absolute right-0 bottom-0 scale-150 origin-bottom-right" />
            <div className="flex gap-8 text-center">
               <div><div className="text-2xl font-bold">{MOCK_COURSES.length}</div><div className="text-xs text-teal-200">在线课程</div></div>
               <div><div className="text-2xl font-bold">{MOCK_KNOWLEDGE_DOCS.length}</div><div className="text-xs text-teal-200">知识文档</div></div>
            </div>
        </div>
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-teal-500 rounded-full mix-blend-overlay opacity-20 blur-3xl"></div>
      </div>

      <div className="flex border-b border-gray-200 bg-white px-6 rounded-t-lg shadow-sm">
         <button onClick={() => setActiveSubTab('recommend')} className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeSubTab === 'recommend' ? 'border-teal-600 text-teal-800 font-bold' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><Award size={16} /> 推荐</button>
         <button onClick={() => setActiveSubTab('courses')} className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeSubTab === 'courses' ? 'border-teal-600 text-teal-800 font-bold' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><Monitor size={16} /> 在线课程</button>
         <button onClick={() => setActiveSubTab('knowledge')} className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeSubTab === 'knowledge' ? 'border-teal-600 text-teal-800 font-bold' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><Folder size={16} /> 知识文库</button>
      </div>
      <div>
         {activeSubTab === 'recommend' && renderRecommend()}
         {activeSubTab === 'courses' && renderCourses()}
         {activeSubTab === 'knowledge' && renderKnowledgeBase()}
      </div>
    </div>
  );
};
