import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/me') || url.includes('/auth/refresh') || url.includes('/auth/verify-otp') || url.includes('/auth/resend-otp');
    if (error.response?.status === 403 && error.response?.data?.requiresVerification) {
      if (!window.location.pathname.startsWith('/verify-otp')) {
        const email = error.response.data.email || '';
        window.location.href = `/verify-otp?email=${encodeURIComponent(email)}`;
      }
      return Promise.reject(error);
    }
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (email) => api.post('/auth/resend-otp', { email }),
  resendVerification: () => api.post('/auth/resend-verification'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  updateProfile: (data) => api.put('/auth/profile', data),
  deleteAccount: () => api.delete('/auth/account'),
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export const habitAPI = {
  getAll: () => api.get('/habits'),
  create: (data) => api.post('/habits', data),
  update: (id, data) => api.put(`/habits/${id}`, data),
  delete: (id) => api.delete(`/habits/${id}`),
  getEntries: (id, params) => api.get(`/habits/${id}/entries`, { params }),
  upsertEntry: (id, data) => api.post(`/habits/${id}/entries`, data),
  monthlyReport: (params) => api.get('/habits/report/monthly', { params }),
  autoMark: () => api.post('/habits/auto-mark'),
};

export const taskAPI = {
  getAll: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  reorder: (tasks) => api.put('/tasks/reorder', { tasks }),
  carryForward: () => api.post('/tasks/carry-forward'),
  stats: () => api.get('/tasks/stats'),
};

export const plannerAPI = {
  get: (params) => api.get('/planner', { params }),
  addBlock: (data) => api.post('/planner/blocks', data),
  updateBlock: (plannerId, blockId, data) => api.put(`/planner/${plannerId}/blocks/${blockId}`, data),
  deleteBlock: (plannerId, blockId) => api.delete(`/planner/${plannerId}/blocks/${blockId}`),
  reorder: (plannerId, blocks) => api.put(`/planner/${plannerId}/reorder`, { blocks }),
  aiReview: (params) => api.get('/planner/ai-review', { params }),
};

export const diaryAPI = {
  getAll: (params) => api.get('/diary', { params }),
  get: (id) => api.get(`/diary/${id}`),
  create: (data) => api.post('/diary', data),
  update: (id, data) => api.put(`/diary/${id}`, data),
  delete: (id) => api.delete(`/diary/${id}`),
  autoSave: (data) => api.post('/diary/autosave', data),
  analyze: (id) => api.post(`/diary/${id}/analyze`),
};

export const noteAPI = {
  getAll: (params) => api.get('/notes', { params }),
  get: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
  getCategories: () => api.get('/notes/categories/list'),
};

export const progressAPI = {
  getDashboard: () => api.get('/progress/dashboard'),
  getTimeline: () => api.get('/progress/timeline'),
};

export const adminAPI = {
  getOverview: () => api.get('/admin/overview'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (id) => api.get(`/admin/users/${id}`),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  getAnalytics: () => api.get('/admin/analytics'),
  getFeedback: (params) => api.get('/admin/feedback', { params }),
  updateFeedbackStatus: (id, status) => api.put(`/admin/feedback/${id}/status`, { status }),
  getFeedbackAnalytics: () => api.get('/admin/feedback/analytics'),
};

export const feedbackAPI = {
  create: (data) => api.post('/feedback', data),
  getAll: () => api.get('/feedback'),
  getById: (id) => api.get(`/feedback/${id}`),
};

export const voiceAPI = {
  startSession: () => api.post('/voice/start'),
  sendMessage: (id, message) => api.post(`/voice/${id}/message`, { message }),
  endSession: (id, data) => api.put(`/voice/${id}/end`, data),
  getHistory: () => api.get('/voice/history'),
  getConversation: (id) => api.get(`/voice/${id}`),
};

export const memoryAPI = {
  getAll: (params) => api.get('/memories', { params }),
  onThisDay: () => api.get('/memories/on-this-day'),
  recap: (params) => api.get('/memories/recap', { params }),
  create: (data) => api.post('/memories', data),
  update: (id, data) => api.put(`/memories/${id}`, data),
  delete: (id) => api.delete(`/memories/${id}`),
};

export const skillAPI = {
  getAll: () => api.get('/skills'),
  get: (id) => api.get(`/skills/${id}`),
  create: (data) => api.post('/skills', data),
  update: (id, data) => api.put(`/skills/${id}`, data),
  delete: (id) => api.delete(`/skills/${id}`),
  getEntries: (id, params) => api.get(`/skills/${id}/entries`, { params }),
  addEntry: (id, data) => api.post(`/skills/${id}/entries`, data),
  aiInsights: (id) => api.get(`/skills/${id}/ai-insights`),
};

export const focusAPI = {
  getSessions: (params) => api.get('/focus', { params }),
  stats: () => api.get('/focus/stats'),
  create: (data) => api.post('/focus', data),
  complete: (id, data) => api.put(`/focus/${id}/complete`, data),
  aiCoaching: () => api.get('/focus/ai-coaching'),
};

export const moodAPI = {
  checkIn: (data) => api.post('/moods/checkin', data),
  getAll: (params) => api.get('/moods', { params }),
  today: () => api.get('/moods/today'),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const aiAPI = {
  getReports: (params) => api.get('/ai', { params }),
  generate: (type) => api.post('/ai/generate', { type }),
};

export const insightsAPI = {
  get: (params) => api.get('/insights', { params }),
};

export default api;
