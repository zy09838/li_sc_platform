import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, usersApi } from '../services/api';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  department?: string;
  role: string;
  points: number;
  createdAt: string;
  _count?: {
    articles: number;
    comments: number;
    articleLikes: number;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  login: (employeeId: string, password: string) => Promise<void>;
  register: (data: { employeeId: string; name: string; email: string; password: string; department: string }) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updatePoints: (points: number) => void;
  checkin: () => Promise<{ reward: number; currentPoints: number }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (employeeId: string, password: string) => {
        set({ isLoading: true });
        try {
          const response: any = await authApi.login({ employeeId, password });
          if (response.success) {
            const { user, token } = response.data;
            localStorage.setItem('token', token);
            set({ user, token, isAuthenticated: true, isLoading: false });
          } else {
            throw new Error(response.message || '登录失败');
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response: any = await authApi.register(data);
          if (response.success) {
            const { user, token } = response.data;
            localStorage.setItem('token', token);
            set({ user, token, isAuthenticated: true, isLoading: false });
          } else {
            throw new Error(response.message || '注册失败');
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }
        
        set({ isLoading: true });
        try {
          const response: any = await authApi.me();
          if (response.success) {
            set({ user: response.data, isAuthenticated: true, isLoading: false, token });
          } else {
            throw new Error('获取用户信息失败');
          }
        } catch (error) {
          localStorage.removeItem('token');
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },

      updatePoints: (points: number) => {
        const user = get().user;
        if (user) {
          set({ user: { ...user, points } });
        }
      },

      checkin: async () => {
        const response: any = await usersApi.checkin();
        if (response.success) {
          const { reward, currentPoints } = response.data;
          const user = get().user;
          if (user) {
            set({ user: { ...user, points: currentPoints } });
          }
          return { reward, currentPoints };
        }
        throw new Error(response.message || '签到失败');
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
