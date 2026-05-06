import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const signup = (data) => api.post('/auth/signup', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Profile
export const getProfile = () => api.get('/profile');
export const updateProfile = (data) => api.put('/profile', data);
export const uploadProfileAvatar = (formData) =>
  api.post('/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Questions
export const getQuestions = (params) => api.get('/questions', { params });
export const getQuestion = (id) => api.get(`/questions/${id}`);
export const generateAIQuestions = (data) => api.post('/questions/generate-ai', data);
export const generateCompanyQuestions = (data) => api.post('/questions/generate-company', data);
export const generateCoreQuestions = (data) => api.post('/questions/generate-core', data);
export const createQuestion = (data) => api.post('/questions', data);
export const updateQuestion = (id, data) => api.put(`/questions/${id}`, data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);

// Test
export const startTest = (data) => api.post('/test/start', data);
export const submitTest = (data) => api.post('/test/submit', data);

// Code
export const runCode = (data) => api.post('/code/run', data);
export const submitCode = (data) => api.post('/code/submit', data);

// Analysis
export const analyzeResults = (data) => api.post('/analysis/analyze', data);
export const getHistory = () => api.get('/analysis/history');

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getLeaderboard = () => api.get('/dashboard/leaderboard');
export const getAdminStats = () => api.get('/dashboard/admin-stats');

// Email
export const sendPracticeEmail = () => api.post('/email/send-link');
export const sendGeneratedQuestionsEmail = (count = 15) => api.post('/email/send-questions', { count });

// Resume
export const analyzeResume = (formData) =>
  api.post('/resume/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// Interview
export const generateInterview = (data = {}) => api.post('/interview/generate', data);
export const evaluateInterview = (data) => api.post('/interview/evaluate', data);

export default api;
