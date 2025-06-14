import axios from 'axios';
import { storage } from '../utils/storage';
import api from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiInstance.interceptors.request.use(
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
apiInstance.interceptors.response.use(
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
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

export const dataService = {
  // Generic CRUD operations
  get: async <T>(endpoint: string) => {
    const response = await apiInstance.get<T>(endpoint);
    return response.data;
  },

  post: async <T>(endpoint: string, data: any) => {
    const response = await apiInstance.post<T>(endpoint, data);
    return response.data;
  },

  put: async <T>(endpoint: string, data: any) => {
    const response = await apiInstance.put<T>(endpoint, data);
    return response.data;
  },

  delete: async <T>(endpoint: string) => {
    const response = await apiInstance.delete<T>(endpoint);
    return response.data;
  },
};

export default apiInstance; 