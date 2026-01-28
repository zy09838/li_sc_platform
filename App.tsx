
import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AIAssistant } from './components/AIAssistant';
import { HomeView } from './views/HomeView';
import { TrainingView } from './views/TrainingView';
import { ActivityView } from './views/ActivityView';
import { ArticleView } from './views/ArticleView';
import { ArticleDetailView } from './views/ArticleDetailView';
import { ActivityDetailView } from './views/ActivityDetailView';
import { MomentsView } from './views/MomentsView';
import { MallView } from './views/MallView';
import { AdminView } from './views/AdminView';
import { AILabView } from './views/AILabView';
import { NavTab, Article, Activity } from './types';
import { CURRENT_USER, MOCK_ACTIVITIES } from './constants';

function App() {
  const [activeTab, setActiveTab] = useState<NavTab>(NavTab.HOME);
  const [currentUser, setCurrentUser] = useState(CURRENT_USER);
  const [userPoints, setUserPoints] = useState(1250); // Lifted state for points
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  // Global Shared States
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  
  // Triggers for cross-component communication
  const [aiSearchTrigger, setAiSearchTrigger] = useState<{query: string, ts: number} | null>(null);
  const [createTrigger, setCreateTrigger] = useState<{type: 'article' | 'activity' | 'moment', ts: number} | null>(null);

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    setSelectedArticle(null);
    setSelectedActivity(null);
  };

  const handleSearch = (query: string) => {
    setAiSearchTrigger({ query, ts: Date.now() });
  };

  const handlePublish = (type: 'article' | 'activity' | 'moment') => {
    const trigger = { type, ts: Date.now() };
    setCreateTrigger(trigger);

    if (type === 'article') {
      setActiveTab(NavTab.ARTICLES);
    } else if (type === 'activity') {
      setActiveTab(NavTab.ACTIVITY);
    } else if (type === 'moment') {
      setActiveTab(NavTab.MOMENTS);
    }
  };

  const handleArticleLike = (authorId: string) => {
    if (authorId === currentUser.id) {
      setCurrentUser(prev => ({
        ...prev,
        stats: {
          ...prev.stats!,
          likes: (prev.stats?.likes || 0) + 1
        }
      }));
    }
  };

  const handleRedeemPoints = (cost: number): boolean => {
    if (userPoints >= cost) {
      setUserPoints(prev => prev - cost);
      return true;
    }
    return false;
  };

  const handleCheckIn = () => {
    setUserPoints(prev => prev + 10);
  };

  const renderContent = () => {
    if (selectedArticle) {
      return (
        <ArticleDetailView 
          article={selectedArticle} 
          onBack={() => setSelectedArticle(null)} 
          onLike={(articleId, authorId) => handleArticleLike(authorId)}
        />
      );
    }

    if (selectedActivity) {
      return (
        <ActivityDetailView 
          activity={selectedActivity} 
          onBack={() => setSelectedActivity(null)}
        />
      );
    }

    switch (activeTab) {
      case NavTab.HOME:
        return (
          <HomeView 
            onArticleClick={(article) => setSelectedArticle(article)} 
            onActivityClick={(activity) => setSelectedActivity(activity)} 
          />
        );
      case NavTab.TRAINING:
        return <TrainingView />;
      case NavTab.AI_LAB:
        return <AILabView />;
      case NavTab.ACTIVITY:
        return (
          <ActivityView 
            activities={activities}
            onActivityClick={(activity) => setSelectedActivity(activity)} 
            triggerCreate={createTrigger?.type === 'activity' && (Date.now() - createTrigger.ts < 1000)}
          />
        );
      case NavTab.ARTICLES:
        return (
          <ArticleView 
            onArticleLike={handleArticleLike} 
            onArticleClick={(article) => setSelectedArticle(article)} 
            triggerCreate={createTrigger?.type === 'article' && (Date.now() - createTrigger.ts < 1000)}
          />
        );
      case NavTab.MOMENTS:
        return (
          <MomentsView 
            triggerCreate={createTrigger?.type === 'moment' && (Date.now() - createTrigger.ts < 1000)}
          />
        );
      case NavTab.MALL:
        return (
          <MallView 
             userPoints={userPoints}
             onRedeem={handleRedeemPoints}
             onNavigate={handleTabChange}
          />
        );
      case NavTab.ADMIN:
        return (
          <AdminView 
            activities={activities}
            onActivitiesChange={setActivities}
            onNavigate={handleTabChange}
          />
        );
      default:
        return <HomeView />;
    }
  };

  const isManagementMode = activeTab === NavTab.ADMIN;

  return (
    <div className={`min-h-screen font-sans text-gray-600 ${isManagementMode ? 'bg-[#f8fafc]' : 'bg-[#f5f7fa]'}`}>
      <Header 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        onSearch={handleSearch}
        onPublish={handlePublish}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 w-full min-w-0">
            {renderContent()}
          </div>

          {!isManagementMode && (
            <div className="hidden lg:block lg:w-72 shrink-0">
              <div className="sticky top-24">
                 <Sidebar 
                   user={currentUser} 
                   userPoints={userPoints}
                   onCheckIn={handleCheckIn}
                 />
              </div>
            </div>
          )}
        </div>
      </main>
      
      <AIAssistant searchTrigger={aiSearchTrigger} />
    </div>
  );
}

export default App;
