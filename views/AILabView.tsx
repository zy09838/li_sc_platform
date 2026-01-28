
import React, { useState } from 'react';
import { Bot, Sparkles, Cpu, Wand2, Terminal, Copy, ExternalLink, Check, Search, Newspaper, Zap, FileCode, BookOpen } from 'lucide-react';
import { MOCK_AI_TOOLS, MOCK_AI_NEWS, MOCK_AI_PROMPTS } from '../constants';
import { AITool, AINews, AIPrompt } from '../types';

export const AILabView: React.FC = () => {
  const [activeToolCategory, setActiveToolCategory] = useState<'All' | 'Writing' | 'Image' | 'Data' | 'Office'>('All');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  const filteredTools = activeToolCategory === 'All' 
    ? MOCK_AI_TOOLS 
    : MOCK_AI_TOOLS.filter(t => t.category === activeToolCategory);

  const handleCopyPrompt = (prompt: AIPrompt) => {
    navigator.clipboard.writeText(prompt.content).then(() => {
      setCopiedPromptId(prompt.id);
      setTimeout(() => setCopiedPromptId(null), 2000);
    });
  };

  const getToolIcon = (iconName: string) => {
    switch(iconName) {
      case 'Bot': return <Bot size={24} />;
      case 'MessageSquare': return <FileCode size={24} />;
      case 'Presentation': return <Wand2 size={24} />;
      case 'Image': return <Sparkles size={24} />;
      case 'Sheet': return <Terminal size={24} />;
      default: return <Cpu size={24} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-800 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg animate-in fade-in duration-500 flex justify-between items-center">
        <div className="relative z-10 max-w-2xl">
           <h2 className="text-3xl font-bold mb-3 tracking-tight flex items-center gap-3">
             <Bot size={32} /> AI赋能 · 智汇实验室
           </h2>
           <p className="text-indigo-100 opacity-90 text-sm leading-relaxed max-w-lg">
             赋能供应链每一位探索者。从 <span className="text-white font-bold border-b border-purple-400">智能工具</span> 到 <span className="text-white font-bold border-b border-purple-400">场景化 Prompt</span>，让 AI 成为您的超级副驾驶。
           </p>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-overlay opacity-20 blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-indigo-500 rounded-full mix-blend-overlay opacity-20 blur-3xl translate-y-1/2"></div>
        <div className="hidden md:block relative z-10 opacity-20 mr-8">
           <Cpu size={100} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Tools & Prompts (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Section 1: AI Toolbox */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in slide-in-from-left-4 duration-500">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
               <div>
                 <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                   <Zap className="text-yellow-500 fill-yellow-500" size={20} /> AI 工具航母
                 </h2>
                 <p className="text-gray-400 text-xs mt-1">精选供应链场景提效利器</p>
               </div>
               
               {/* Tool Categories */}
               <div className="flex p-1 bg-gray-100 rounded-lg overflow-x-auto max-w-full">
                 {['All', 'Writing', 'Data', 'Image', 'Office'].map(cat => (
                   <button
                     key={cat}
                     onClick={() => setActiveToolCategory(cat as any)}
                     className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                       activeToolCategory === cat 
                       ? 'bg-white text-indigo-600 shadow-sm' 
                       : 'text-gray-500 hover:text-gray-700'
                     }`}
                   >
                     {cat === 'All' ? '全部' : cat}
                   </button>
                 ))}
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTools.map(tool => (
                  <div key={tool.id} className="group border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 bg-gradient-to-br from-white to-gray-50/50">
                     <div className="flex justify-between items-start mb-3">
                        <div className={`p-3 rounded-xl ${tool.isInternal ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'} group-hover:scale-110 transition-transform`}>
                           {getToolIcon(tool.icon)}
                        </div>
                        {tool.isInternal && (
                          <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">内部自研</span>
                        )}
                     </div>
                     <h3 className="font-bold text-gray-800 mb-1 group-hover:text-indigo-700 transition-colors">{tool.name}</h3>
                     <p className="text-xs text-gray-500 mb-4 h-8 line-clamp-2">{tool.description}</p>
                     
                     <div className="flex gap-2">
                        <a href={tool.url} target="_blank" rel="noreferrer" className="flex-1 bg-gray-900 text-white text-center py-2 rounded-lg text-xs font-bold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-1">
                          立即使用 <ExternalLink size={12} />
                        </a>
                        <button className="px-3 py-2 border border-gray-200 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                          <BookOpen size={16} />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </section>

          {/* Section 2: Prompt Library */}
          <section className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-6 text-white animate-in slide-in-from-bottom-4 duration-500">
             <div className="mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                  <Terminal className="text-green-400" size={20} /> 提示词百宝箱
                </h2>
                <p className="text-slate-400 text-xs">复制即用的供应链专属指令 (Prompt)</p>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {MOCK_AI_PROMPTS.map(prompt => (
                   <div key={prompt.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-indigo-500/50 transition-colors group">
                      <div className="flex justify-between items-start mb-3">
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                               <h3 className="font-bold text-slate-200">{prompt.title}</h3>
                               <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                                 {prompt.scenario}
                               </span>
                            </div>
                            <div className="flex gap-2">
                               {prompt.tags.map(tag => (
                                 <span key={tag} className="text-[10px] text-slate-500">#{tag}</span>
                               ))}
                            </div>
                         </div>
                         <button 
                           onClick={() => handleCopyPrompt(prompt)}
                           className={`p-2 rounded-lg transition-all ${
                             copiedPromptId === prompt.id 
                             ? 'bg-green-500/20 text-green-400' 
                             : 'bg-slate-700 text-slate-400 hover:bg-indigo-600 hover:text-white'
                           }`}
                           title="复制 Prompt"
                         >
                            {copiedPromptId === prompt.id ? <Check size={16} /> : <Copy size={16} />}
                         </button>
                      </div>
                      
                      <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-slate-300 leading-relaxed border-l-2 border-indigo-500 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-1 opacity-20">
                            <Terminal size={40} />
                         </div>
                         {prompt.content}
                      </div>
                      <div className="mt-2 text-[10px] text-slate-500 text-right">
                         {prompt.copyCount} 人已使用
                      </div>
                   </div>
                ))}
             </div>
          </section>

        </div>

        {/* Right Column: News (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
                 <Newspaper className="text-blue-500" size={20} /> 前沿情报局
              </h2>
              
              <div className="space-y-6 relative">
                 {/* Vertical Line */}
                 <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-gray-100"></div>

                 {MOCK_AI_NEWS.map((news, idx) => (
                    <div key={news.id} className="relative pl-6 animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                       <div className="absolute left-0 top-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-500 rounded-full z-10"></div>
                       <div className="mb-1 flex items-center justify-between">
                          <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 rounded">{news.tag}</span>
                          <span className="text-[10px] text-gray-400">{news.date}</span>
                       </div>
                       
                       {news.imageUrl && (
                         <div className="mb-2 rounded-lg overflow-hidden h-24 border border-gray-100">
                            <img src={news.imageUrl} alt="news" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                         </div>
                       )}

                       <h3 className="text-sm font-bold text-gray-800 mb-1 leading-snug hover:text-indigo-700 cursor-pointer transition-colors">{news.title}</h3>
                       <p className="text-xs text-gray-500 leading-relaxed">{news.summary}</p>
                    </div>
                 ))}
              </div>

              <button className="w-full mt-6 py-2 text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors border border-dashed border-gray-200 rounded-lg hover:border-indigo-300">
                 查看更多动态
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
