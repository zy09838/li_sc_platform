import axios from 'axios';

const API_BASE = '/api';

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Auth API
export const authApi = {
  register: (data: { employeeId: string; name: string; email: string; password: string; department: string }) =>
    api.post('/auth', { ...data }, { params: { action: 'register' } }),
  login: (data: { employeeId: string; password: string }) =>
    api.post('/auth', data, { params: { action: 'login' } }),
  logout: () => api.post('/auth', {}, { params: { action: 'logout' } }),
  me: () => api.get('/auth', { params: { action: 'me' } }),
};

// Users API
export const usersApi = {
  getUser: (id: string) => api.get('/users', { params: { action: 'detail', id } }),
  updateUser: (id: string, data: any) => api.put('/users', data, { params: { action: 'detail', id } }),
  checkin: () => api.post('/users', {}, { params: { action: 'checkin' } }),
  getPoints: (id: string, page = 1, limit = 20) =>
    api.get('/users', { params: { action: 'points', id, page, limit } }),
  getLeaderboard: (limit = 10) => api.get('/users', { params: { action: 'leaderboard', limit } }),
};

// Articles API
export const articlesApi = {
  list: (params?: { page?: number; limit?: number; category?: string; search?: string; sort?: string }) =>
    api.get('/articles', { params: { action: 'list', ...params } }),
  getHot: (limit = 5) => api.get('/articles', { params: { action: 'hot', limit } }),
  getCategories: () => api.get('/articles', { params: { action: 'categories' } }),
  getDetail: (id: string) => api.get('/articles', { params: { action: 'detail', id } }),
  create: (data: { title: string; summary: string; content: string; category: string; tags?: string[]; imageUrl?: string }) =>
    api.post('/articles', data, { params: { action: 'list' } }),
  update: (id: string, data: any) => api.put('/articles', data, { params: { action: 'detail', id } }),
  delete: (id: string) => api.delete('/articles', { params: { action: 'detail', id } }),
  like: (id: string) => api.post('/articles', {}, { params: { action: 'like', id } }),
  pin: (id: string) => api.post('/articles', {}, { params: { action: 'pin', id } }),
};

// Comments API
export const commentsApi = {
  list: (articleId: string, page = 1, limit = 20) =>
    api.get('/comments', { params: { action: 'list', articleId, page, limit } }),
  create: (data: { articleId: string; content: string; parentId?: string }) =>
    api.post('/comments', data, { params: { action: 'list' } }),
  delete: (id: string) => api.delete('/comments', { params: { action: 'delete', id } }),
};

// Activities API
export const activitiesApi = {
  list: (params?: { status?: string; month?: number; year?: number; page?: number; limit?: number }) =>
    api.get('/activities', { params: { action: 'list', ...params } }),
  getCalendar: (month?: number, year?: number) =>
    api.get('/activities', { params: { action: 'calendar', month, year } }),
  getDetail: (id: string) => api.get('/activities', { params: { action: 'detail', id } }),
  create: (data: any) => api.post('/activities', data, { params: { action: 'list' } }),
  update: (id: string, data: any) => api.put('/activities', data, { params: { action: 'detail', id } }),
  delete: (id: string) => api.delete('/activities', { params: { action: 'detail', id } }),
  register: (id: string) => api.post('/activities', {}, { params: { action: 'register', id } }),
  vote: (id: string, optionId: string) => api.post('/activities', { optionId }, { params: { action: 'vote', id } }),
};

// Courses API
export const coursesApi = {
  list: (params?: { category?: string; page?: number; limit?: number }) =>
    api.get('/courses', { params: { action: 'list', ...params } }),
  getMyCourses: () => api.get('/courses', { params: { action: 'my' } }),
  getLearningPaths: () => api.get('/courses', { params: { action: 'learning-paths' } }),
  getKnowledgeDocs: (params?: { category?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/courses', { params: { action: 'knowledge-docs', ...params } }),
  updateProgress: (id: string, progress: number) =>
    api.post('/courses', { progress }, { params: { action: 'progress', id } }),
  downloadDoc: (id: string) => api.post('/courses', {}, { params: { action: 'download', id } }),
};

// Products API
export const productsApi = {
  list: (params?: { category?: string; page?: number; limit?: number }) =>
    api.get('/products', { params: { action: 'list', ...params } }),
  getCategories: () => api.get('/products', { params: { action: 'categories' } }),
  getOrders: (page = 1, limit = 10) =>
    api.get('/products', { params: { action: 'orders', page, limit } }),
  createOrder: (productId: string) =>
    api.post('/products', { productId }, { params: { action: 'orders' } }),
};

// Tasks API
export const tasksApi = {
  list: () => api.get('/tasks', { params: { action: 'list' } }),
  complete: (id: string) => api.post('/tasks', {}, { params: { action: 'complete', id } }),
};

// Wishes API
export const wishesApi = {
  list: (page = 1, limit = 20) => api.get('/wishes', { params: { action: 'list', page, limit } }),
  create: (data: { content: string; isAnonymous?: boolean; color?: string }) =>
    api.post('/wishes', data, { params: { action: 'list' } }),
  like: (id: string) => api.post('/wishes', {}, { params: { action: 'like', id } }),
  getFoods: (page = 1, limit = 10) => api.get('/wishes', { params: { action: 'food', page, limit } }),
  createFood: (data: { name: string; rating: number; imageUrl?: string; tags?: string[] }) =>
    api.post('/wishes', data, { params: { action: 'food' } }),
};

// Notifications API
export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get('/notifications', { params: { action: 'list', ...params } }),
  delete: (id: string) => api.delete('/notifications', { params: { action: 'delete', id } }),
  markAsRead: (id: string) => api.post('/notifications', {}, { params: { action: 'read', id } }),
  markAllAsRead: () => api.post('/notifications', {}, { params: { action: 'read-all' } }),
};

export default api;
