import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { AIAssistant } from './AIAssistant';
import { useAuthStore } from '../stores/authStore';

interface LayoutProps {
  showSidebar?: boolean;
  requireAuth?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ showSidebar = true, requireAuth = false }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (requireAuth && !isAuthenticated && !isLoading) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen font-sans text-gray-600 bg-[#f5f7fa]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 w-full min-w-0">
            <Outlet />
          </div>

          {showSidebar && (
            <div className="hidden lg:block lg:w-72 shrink-0">
              <div className="sticky top-24">
                <Sidebar />
              </div>
            </div>
          )}
        </div>
      </main>

      <AIAssistant />
    </div>
  );
};

// Layout without sidebar (for admin, profile, etc.)
export const FullWidthLayout: React.FC<{ requireAuth?: boolean }> = ({ requireAuth = false }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (requireAuth && !isAuthenticated && !isLoading) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen font-sans text-gray-600 bg-[#f8fafc]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};
