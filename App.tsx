import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { Loading } from './components/Loading';
import { Layout, FullWidthLayout } from './components/Layout';

// Views
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { HomeView } from './views/HomeView';
import { TrainingView } from './views/TrainingView';
import { ActivityView } from './views/ActivityView';
import { ActivityDetailView } from './views/ActivityDetailView';
import { ArticleView } from './views/ArticleView';
import { ArticleDetailView } from './views/ArticleDetailView';
import { MomentsView } from './views/MomentsView';
import { MallView } from './views/MallView';
import { AdminView } from './views/AdminView';
import { AILabView } from './views/AILabView';

function App() {
  const { fetchUser, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading) {
    return <Loading fullScreen text="正在加载..." />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes - No Layout */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginView />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/" replace /> : <RegisterView />
        } />

        {/* Main Layout with Sidebar */}
        <Route element={<Layout showSidebar={true} />}>
          <Route path="/" element={<HomeView />} />
          <Route path="/training" element={<TrainingView />} />
          <Route path="/ai-lab" element={<AILabView />} />
          <Route path="/activities" element={<ActivityView />} />
          <Route path="/activities/:id" element={<ActivityDetailView />} />
          <Route path="/articles" element={<ArticleView />} />
          <Route path="/articles/:id" element={<ArticleDetailView />} />
          <Route path="/moments" element={<MomentsView />} />
          <Route path="/mall" element={<MallView />} />
        </Route>

        {/* Full Width Layout (No Sidebar) */}
        <Route element={<FullWidthLayout requireAuth={true} />}>
          <Route path="/admin" element={<AdminView />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
