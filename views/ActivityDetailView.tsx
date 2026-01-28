import React, { useState } from 'react';
import { Activity } from '../types';
import { ArrowLeft, MapPin, Calendar, Users, Share2, CheckCircle2, AlertCircle, BarChart3, Check } from 'lucide-react';

interface ActivityDetailViewProps {
  activity: Activity;
  onBack: () => void;
}

export const ActivityDetailView: React.FC<ActivityDetailViewProps> = ({ activity, onBack }) => {
  // Local state to simulate interactions
  const [isRegistered, setIsRegistered] = useState(activity.isRegistered || false);
  const [participantsCount, setParticipantsCount] = useState(activity.participants);
  const [userVotedId, setUserVotedId] = useState<string | undefined>(activity.userVotedOptionId);
  const [voteOptions, setVoteOptions] = useState(activity.voteOptions || []);
  const [showShareToast, setShowShareToast] = useState(false);

  const handleRegister = () => {
    if (isRegistered) {
      // Cancel registration
      setIsRegistered(false);
      setParticipantsCount(prev => prev - 1);
    } else {
      // Register
      setIsRegistered(true);
      setParticipantsCount(prev => prev + 1);
    }
  };

  const handleVote = (optionId: string) => {
    if (userVotedId) return; // Already voted

    setUserVotedId(optionId);
    setVoteOptions(prev => prev.map(opt => {
      if (opt.id === optionId) {
        return { ...opt, count: opt.count + 1 };
      }
      return opt;
    }));
  };

  const handleShare = async () => {
    const shareData = {
      title: activity.title,
      text: activity.description || `Join me at ${activity.title}`,
      url: window.location.href,
    };

    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 2000);
      } catch (err) {
        console.debug('Clipboard failed', err);
      }
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // If user cancelled, do nothing
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        // Fallback to clipboard without logging as error
        await copyToClipboard();
      }
    } else {
      await copyToClipboard();
    }
  };

  const totalVotes = voteOptions.reduce((acc, curr) => acc + curr.count, 0);

  // Parse description for basic formatting
  const renderDescription = (text?: string) => {
    if (!text) return <p className="text-gray-500">暂无详细介绍</p>;
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('**')) return <h4 key={idx} className="font-bold text-gray-800 mt-4 mb-2">{trimmed.replace(/\*\*/g, '')}</h4>;
      if (trimmed.startsWith('*')) return <li key={idx} className="list-disc list-inside ml-4 text-gray-600 mb-1">{trimmed.replace('*', '')}</li>;
      if (trimmed === '') return <br key={idx} />;
      return <p key={idx} className="text-gray-600 leading-relaxed mb-2">{line}</p>;
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-10 animate-in fade-in slide-in-from-right-4 duration-300 relative">
      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2 text-sm backdrop-blur-sm animate-in fade-in zoom-in duration-200">
           <Check size={16} className="text-green-400" /> 链接已复制
        </div>
      )}

      {/* Navigation */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-teal-700 transition-colors font-medium mb-4 px-2 py-1 rounded-lg hover:bg-gray-100 w-fit"
      >
        <ArrowLeft size={18} /> 返回活动列表
      </button>

      {/* Hero Image */}
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-sm mb-6 bg-gray-200">
        <img src={activity.image} alt={activity.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6 md:left-10 text-white">
          <div className="flex gap-2 mb-2">
             <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border border-white/20 backdrop-blur-sm
                ${activity.status === 'Upcoming' ? 'bg-green-500/80' : 
                  activity.status === 'Ongoing' ? 'bg-blue-500/80' : 'bg-gray-500/80'}`}>
                {activity.status === 'Upcoming' ? '报名中' : activity.status === 'Ongoing' ? '进行中' : '已结束'}
             </span>
             {activity.isQuarterly && <span className="bg-yellow-500/80 text-white px-2.5 py-0.5 rounded text-xs font-bold backdrop-blur-sm">季度重磅</span>}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold shadow-sm">{activity.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
           {/* Info Card */}
           <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-wrap gap-y-4 gap-x-8">
              <div className="flex items-center gap-3">
                 <div className="bg-teal-50 p-2 rounded-lg text-teal-600"><Calendar size={20} /></div>
                 <div>
                    <div className="text-xs text-gray-400">时间</div>
                    <div className="font-medium text-gray-800">{activity.date}</div>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><MapPin size={20} /></div>
                 <div>
                    <div className="text-xs text-gray-400">地点</div>
                    <div className="font-medium text-gray-800">{activity.location}</div>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="bg-orange-50 p-2 rounded-lg text-orange-600"><Users size={20} /></div>
                 <div>
                    <div className="text-xs text-gray-400">参与人数</div>
                    <div className="font-medium text-gray-800">{participantsCount} 人</div>
                 </div>
              </div>
           </div>

           {/* Voting Section */}
           {activity.hasVoting && (
             <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                   <BarChart3 className="text-indigo-600" />
                   <h3 className="font-bold text-indigo-900 text-lg">{activity.voteTitle || '参与投票'}</h3>
                </div>
                <div className="space-y-3">
                   {voteOptions.map(option => {
                      const percentage = totalVotes > 0 ? Math.round((option.count / totalVotes) * 100) : 0;
                      const isSelected = userVotedId === option.id;
                      
                      return (
                        <div 
                          key={option.id}
                          onClick={() => !userVotedId && handleVote(option.id)}
                          className={`relative border rounded-lg p-3 overflow-hidden transition-all 
                            ${userVotedId 
                               ? 'border-indigo-100 bg-white cursor-default' 
                               : 'border-indigo-200 bg-white hover:border-indigo-400 hover:shadow-md cursor-pointer group'}`}
                        >
                           {/* Progress Bar Background */}
                           {userVotedId && (
                             <div 
                               className="absolute top-0 left-0 bottom-0 bg-indigo-100/50 transition-all duration-1000 ease-out" 
                               style={{ width: `${percentage}%` }}
                             />
                           )}
                           
                           <div className="relative flex justify-between items-center z-10">
                              <span className={`font-medium ${isSelected ? 'text-indigo-700 font-bold' : 'text-gray-700'}`}>
                                {option.label}
                              </span>
                              
                              {userVotedId ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-indigo-900">{percentage}%</span>
                                  {isSelected && <CheckCircle2 size={16} className="text-indigo-600" />}
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-indigo-500" />
                              )}
                           </div>
                        </div>
                      );
                   })}
                </div>
                <p className="text-xs text-indigo-400 mt-3 text-center">
                   {userVotedId ? `感谢您的参与！共 ${totalVotes} 人已投票` : '点击选项即可投票，每人仅限一票'}
                </p>
             </div>
           )}

           {/* Description */}
           <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg mb-4 border-l-4 border-teal-600 pl-3">活动详情</h3>
              <div className="text-gray-600 leading-7">
                 {renderDescription(activity.description)}
              </div>
           </div>
        </div>

        {/* Sidebar Actions */}
        <div className="md:col-span-1 space-y-4">
           {/* Registration Card */}
           <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <div className="mb-6">
                 <div className="text-sm text-gray-500 mb-1">报名截止</div>
                 <div className="font-bold text-gray-800">活动开始前 24 小时</div>
              </div>
              
              <button 
                onClick={handleRegister}
                className={`w-full py-3 rounded-xl font-bold text-sm mb-3 flex items-center justify-center gap-2 transition-all shadow-sm
                  ${isRegistered 
                    ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' 
                    : 'bg-teal-700 text-white hover:bg-teal-800 hover:shadow-md'}`}
              >
                {isRegistered ? (
                  <>
                    <AlertCircle size={18} /> 取消报名
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> 立即报名
                  </>
                )}
              </button>
              
              <button 
                onClick={handleShare}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 size={16} /> 分享给同事
              </button>

              {isRegistered && (
                <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-3 flex gap-2">
                   <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
                   <p className="text-xs text-green-700">您已成功报名！请留意日程提醒。</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}