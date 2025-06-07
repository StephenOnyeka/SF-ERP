import axios from 'axios';
import { storage } from '../utils/storage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = storage.get('token', '');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      storage.remove('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data;
    storage.set('token', token);
    storage.set('user', user);
    return response.data;
  },

  logout: () => {
    storage.remove('token');
    storage.remove('user');
  },

  getCurrentUser: () => {
    return storage.get('user', null);
  },
};

export const dataService = {
  // Generic CRUD operations
  get: async <T>(endpoint: string) => {
    const response = await api.get<T>(endpoint);
    return response.data;
  },

  post: async <T>(endpoint: string, data: any) => {
    const response = await api.post<T>(endpoint, data);
    return response.data;
  },

  put: async <T>(endpoint: string, data: any) => {
    const response = await api.put<T>(endpoint, data);
    return response.data;
  },

  delete: async <T>(endpoint: string) => {
    const response = await api.delete<T>(endpoint);
    return response.data;
  },
};

export default api; 