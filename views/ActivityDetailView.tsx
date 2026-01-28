import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Check, Vote, Share2, Loader2 } from 'lucide-react';
import { activitiesApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Loading } from '../components/Loading';

interface VoteOption {
  id: string;
  text: string;
  votes: number;
  percentage?: number;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  content?: string;
  type: 'event' | 'meeting' | 'workshop' | 'vote' | 'other';
  status: 'upcoming' | 'ongoing' | 'ended';
  startTime: string;
  endTime: string;
  location?: string;
  capacity?: number;
  registrations?: number;
  imageUrl?: string;
  isRegistered?: boolean;
  voteOptions?: VoteOption[];
  userVoted?: string;
  organizer?: {
    name: string;
    avatarUrl?: string;
  };
}

export const ActivityDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [voting, setVoting] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadActivity();
    }
  }, [id]);

  const loadActivity = async () => {
    try {
      const response: any = await activitiesApi.getDetail(id!);
      if (response.success) {
        setActivity(response.data);
        if (response.data.userVoted) {
          setSelectedVote(response.data.userVoted);
        }
      }
    } catch (err: any) {
      setError(err?.message || '加载活动详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    setRegistering(true);
    try {
      const response: any = await activitiesApi.register(id!);
      if (response.success) {
        setActivity(prev => prev ? {
          ...prev,
          isRegistered: true,
          registrations: (prev.registrations || 0) + 1
        } : null);
      }
    } catch (err: any) {
      setError(err?.message || '报名失败');
    } finally {
      setRegistering(false);
    }
  };

  const handleVote = async () => {
    if (!selectedVote || !isAuthenticated) {
      if (!isAuthenticated) navigate('/login');
      return;
    }
    
    setVoting(true);
    try {
      const response: any = await activitiesApi.vote(id!, selectedVote);
      if (response.success) {
        setActivity(prev => {
          if (!prev) return null;
          const totalVotes = (prev.voteOptions || []).reduce((sum, o) => sum + o.votes, 0) + 1;
          return {
            ...prev,
            userVoted: selectedVote,
            voteOptions: prev.voteOptions?.map(o => ({
              ...o,
              votes: o.id === selectedVote ? o.votes + 1 : o.votes,
              percentage: Math.round(((o.id === selectedVote ? o.votes + 1 : o.votes) / totalVotes) * 100)
            }))
          };
        });
      }
    } catch (err: any) {
      setError(err?.message || '投票失败');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!activity) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">活动不存在或已删除</p>
        <button onClick={() => navigate('/activities')} className="mt-4 text-teal-600 hover:underline">
          返回活动列表
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">即将开始</span>;
      case 'ongoing':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">进行中</span>;
      case 'ended':
        return <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">已结束</span>;
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
    return <span className={`${t.bg} ${t.text} px-2 py-1 rounded text-xs`}>{t.label}</span>;
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/activities')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={18} /> 返回活动列表
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Activity Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {activity.imageUrl && (
          <div className="h-64 bg-gray-100">
            <img src={activity.imageUrl} alt={activity.title} className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            {getTypeBadge(activity.type)}
            {getStatusBadge(activity.status)}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{activity.title}</h1>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <span>{new Date(activity.startTime).toLocaleDateString('zh-CN', { 
                month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
              })}</span>
            </div>
            {activity.location && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <span>{activity.location}</span>
              </div>
            )}
            {activity.capacity && (
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gray-400" />
                <span>{activity.registrations || 0}/{activity.capacity} 人</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span>
                {new Date(activity.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - 
                {new Date(activity.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none mb-6 text-gray-700">
            <p className="whitespace-pre-wrap">{activity.content || activity.description}</p>
          </div>

          {/* Vote Section */}
          {activity.type === 'vote' && activity.voteOptions && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Vote size={18} className="text-teal-600" /> 投票选项
              </h3>
              <div className="space-y-3">
                {activity.voteOptions.map(option => (
                  <div 
                    key={option.id}
                    onClick={() => !activity.userVoted && setSelectedVote(option.id)}
                    className={`relative p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      activity.userVoted
                        ? option.id === activity.userVoted
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 bg-white'
                        : selectedVote === option.id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{option.text}</span>
                      <span className="text-sm text-gray-500">
                        {option.votes} 票 
                        {option.percentage !== undefined && ` (${option.percentage}%)`}
                      </span>
                    </div>
                    {activity.userVoted && (
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${option.id === activity.userVoted ? 'bg-teal-500' : 'bg-gray-400'} transition-all`}
                          style={{ width: `${option.percentage || 0}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {!activity.userVoted && (
                <button
                  onClick={handleVote}
                  disabled={!selectedVote || voting}
                  className="mt-4 w-full bg-teal-700 text-white py-2 rounded-lg font-medium hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {voting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <Check size={18} /> 确认投票
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {activity.type !== 'vote' && activity.status !== 'ended' && (
              <button
                onClick={handleRegister}
                disabled={activity.isRegistered || registering || (activity.capacity !== undefined && (activity.registrations || 0) >= activity.capacity)}
                className={`flex-1 py-3 rounded-lg font-bold text-center transition-all flex items-center justify-center gap-2 ${
                  activity.isRegistered
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-teal-700 text-white hover:bg-teal-800'
                } disabled:opacity-50`}
              >
                {registering ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : activity.isRegistered ? (
                  <><Check size={18} /> 已报名</>
                ) : (activity.capacity && (activity.registrations || 0) >= activity.capacity) ? (
                  '名额已满'
                ) : (
                  '立即报名'
                )}
              </button>
            )}
            
            <button className="p-3 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
