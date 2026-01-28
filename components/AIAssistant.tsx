import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Maximize2, Minimize2, FileText, BookOpen, GraduationCap, Loader2, ArrowRight } from 'lucide-react';
import { MOCK_ARTICLES, MOCK_DOCS, MOCK_COURSES } from '../constants';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: React.ReactNode;
  timestamp: Date;
}

interface AIAssistantProps {
  searchTrigger?: { query: string; ts: number } | null;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ searchTrigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'ai',
      timestamp: new Date(),
      content: (
        <div className="space-y-2">
          <p>嗨！我是 Li-SC 供应链智能助手 👋</p>
          <p>我已经连接到公司内部知识库。我可以帮您检索：</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-gray-500 ml-1">
            <li>最新的行业研报与发文</li>
            <li>内部培训资料与SOP文档</li>
            <li>理链大学堂的相关课程</li>
          </ul>
        </div>
      )
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isExpanded]);

  // Listen for external search triggers
  useEffect(() => {
    if (searchTrigger && searchTrigger.query) {
      setIsOpen(true);
      // Short timeout to ensure the UI is rendered before sending
      setTimeout(() => {
        handleSendMessage(searchTrigger.query);
      }, 300);
    }
  }, [searchTrigger]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI Processing & Search
    setTimeout(() => {
      const keywords = text.toLowerCase().split(/\s+/).filter(k => k.length > 0);
      
      // 1. Search Articles
      const foundArticles = MOCK_ARTICLES.filter(a => 
        keywords.some(k => a.title.toLowerCase().includes(k) || a.summary.toLowerCase().includes(k))
      );

      // 2. Search Docs
      const foundDocs = MOCK_DOCS.filter(d => 
        keywords.some(k => d.title.toLowerCase().includes(k))
      );

      // 3. Search Courses
      const foundCourses = MOCK_COURSES.filter(c => 
        keywords.some(k => c.title.toLowerCase().includes(k))
      );

      const hasResults = foundArticles.length > 0 || foundDocs.length > 0 || foundCourses.length > 0;
      let aiResponseContent: React.ReactNode;

      if (hasResults) {
        aiResponseContent = (
          <div className="space-y-4">
            <p>基于您的关键词 "{text}"，我在知识库中找到了以下内容：</p>
            
            {foundArticles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded w-fit">
                  <FileText size={12} /> 供应链发文 / 研报
                </div>
                {foundArticles.slice(0, 2).map(a => (
                  <div key={a.id} className="bg-white border border-gray-100 p-2.5 rounded-lg shadow-sm hover:border-teal-300 transition-colors cursor-pointer group">
                    <div className="font-medium text-gray-800 text-xs mb-1 group-hover:text-teal-700">{a.title}</div>
                    <div className="text-[10px] text-gray-400 line-clamp-2">{a.summary}</div>
                  </div>
                ))}
              </div>
            )}

            {foundDocs.length > 0 && (
              <div className="space-y-2">
                 <div className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded w-fit">
                  <BookOpen size={12} /> 资料文档
                </div>
                {foundDocs.slice(0, 2).map(d => (
                   <div key={d.id} className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded-lg text-xs hover:bg-blue-50/50 cursor-pointer transition-colors">
                      <span className="text-gray-700 truncate mr-2">{d.title}</span>
                      <span className="text-gray-400 whitespace-nowrap text-[10px]">{d.size}</span>
                   </div>
                ))}
              </div>
            )}

            {foundCourses.length > 0 && (
              <div className="space-y-2">
                 <div className="flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded w-fit">
                  <GraduationCap size={12} /> 相关课程
                </div>
                {foundCourses.slice(0, 2).map(c => (
                   <div key={c.id} className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded-lg text-xs hover:bg-orange-50/50 cursor-pointer transition-colors">
                      <span className="text-gray-700 truncate mr-2">{c.title}</span>
                      <ArrowRight size={10} className="text-gray-400" />
                   </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
               您可以点击卡片查看详情，或者尝试询问更具体的问题。
            </p>
          </div>
        );
      } else {
        if (text.match(/你好|hello|hi/i)) {
           aiResponseContent = "你好！请问有什么可以帮您？您可以尝试搜索“库存”、“谈判技巧”或“2025规划”等关键词。";
        } else {
           aiResponseContent = (
            <div>
              <p>抱歉，我在知识库中没有找到与 "{text}" 直接相关的文档。</p>
              <p className="mt-2 text-xs text-gray-500">建议您：</p>
              <ul className="list-disc list-inside text-xs text-gray-500 mt-1">
                <li>尝试使用更通用的关键词（如：战略、培训、活动）</li>
                <li>检查是否有错别字</li>
                <li>或者直接联系管理员反馈需求</li>
              </ul>
            </div>
           );
        }
      }

      const aiMsg: Message = {
        id: Date.now().toString() + '-ai',
        role: 'ai',
        content: aiResponseContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);
    }, 1500);
  };

  // Collapsed State (Floating Button)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-50 flex items-center justify-center group animate-in fade-in zoom-in duration-300"
        title="打开 AI 助手"
      >
        <Sparkles size={24} className="group-hover:animate-pulse" />
        <span className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
        <span className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full"></span>
      </button>
    );
  }

  // Expanded State (Chat Window)
  return (
    <div 
      className={`fixed bottom-8 right-8 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-50 transition-all duration-300 overflow-hidden ${
        isExpanded ? 'w-[600px] h-[800px] max-h-[90vh] max-w-[95vw]' : 'w-96 h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-600 p-4 flex justify-between items-center text-white shrink-0 cursor-move">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg">
             <Sparkles size={16} />
          </div>
          <span className="font-bold text-sm tracking-wide">Li-SC 知识库助手</span>
        </div>
        <div className="flex items-center gap-1">
           <button 
             onClick={() => setIsExpanded(!isExpanded)} 
             className="hover:bg-white/20 p-1.5 rounded transition-colors"
             title={isExpanded ? "缩小" : "放大"}
           >
             {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
           </button>
           <button 
             onClick={() => setIsOpen(false)} 
             className="hover:bg-red-500/80 hover:text-white p-1.5 rounded transition-colors"
             title="关闭"
           >
             <X size={16} />
           </button>
        </div>
      </div>

      {/* Chat Body */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
         {messages.map((msg) => (
           <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border 
                  ${msg.role === 'ai' ? 'bg-teal-100 text-teal-700 border-teal-200' : 'bg-gray-200 text-gray-600 border-gray-300'}`}>
                 {msg.role === 'ai' ? <Sparkles size={16} /> : <span className="text-xs font-bold">Me</span>}
              </div>
              <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm 
                  ${msg.role === 'ai' 
                    ? 'bg-white rounded-tl-none border border-gray-100 text-gray-700' 
                    : 'bg-teal-600 text-white rounded-tr-none'}`}>
                 {msg.content}
              </div>
           </div>
         ))}
         
         {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 shrink-0 border border-teal-200">
                  <Sparkles size={16} />
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 size={14} className="animate-spin" />
                  正在检索知识库...
              </div>
            </div>
         )}
         
         {messages.length === 1 && (
            <div className="pl-11 space-y-2">
                <p className="text-xs text-gray-400 mb-2">您可以试着问我：</p>
                <button onClick={() => handleSendMessage("最近有哪些重要的供应链会议？")} className="w-full text-left text-xs bg-white border border-gray-200 hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50 p-2.5 rounded-lg transition-all shadow-sm">
                  📅 最近有哪些重要的供应链会议？
                </button>
                <button onClick={() => handleSendMessage("帮我找关于库存优化的资料")} className="w-full text-left text-xs bg-white border border-gray-200 hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50 p-2.5 rounded-lg transition-all shadow-sm">
                  📚 帮我找关于库存优化的资料
                </button>
                <button onClick={() => handleSendMessage("查询采购谈判课程")} className="w-full text-left text-xs bg-white border border-gray-200 hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50 p-2.5 rounded-lg transition-all shadow-sm">
                  🎓 查询采购谈判课程
                </button>
            </div>
         )}
         
         <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
         <div className="relative">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
              placeholder="请输入您的问题或关键词..." 
              className="w-full bg-gray-100 border border-transparent rounded-full pl-4 pr-11 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white focus:border-transparent outline-none transition-all placeholder-gray-400"
            />
            <button 
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-1.5 rounded-full transition-colors shadow-sm"
            >
              <Send size={14} />
            </button>
         </div>
         <div className="text-center mt-2">
            <span className="text-[10px] text-gray-300">AI生成内容基于现有知识库，仅供参考</span>
         </div>
      </div>
    </div>
  );
};