import { create } from 'zustand';
import { notificationsApi } from '../services/api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  fetchNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (params) => {
    set({ isLoading: true });
    try {
      const response: any = await notificationsApi.list(params);
      if (response.success) {
        set({
          notifications: response.data.notifications,
          unreadCount: response.data.unreadCount,
          isLoading: false,
        });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      const response: any = await notificationsApi.markAsRead(id);
      if (response.success) {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      }
    } catch (error) {
      console.error('Mark as read failed:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const response: any = await notificationsApi.markAllAsRead();
      if (response.success) {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
      }
    } catch (error) {
      console.error('Mark all as read failed:', error);
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const response: any = await notificationsApi.delete(id);
      if (response.success) {
        const notification = get().notifications.find((n) => n.id === id);
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: notification && !notification.isRead
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        }));
      }
    } catch (error) {
      console.error('Delete notification failed:', error);
    }
  },
}));
