import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Admin API endpoints
export const adminApi = {
  // User Management
  getUsers: () => api.get('/admin/users'),
  updateUser: (id: string, data: any) => api.patch(`/admin/users/${id}`, data),
  
  // System Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: any) => api.patch('/admin/settings', data),
  
  // Leave Management
  getLeaveRequests: (params?: any) => api.get('/admin/leaves', { params }),
  updateLeaveStatus: (id: string, data: any) => api.patch(`/admin/leaves/${id}/status`, data),
  
  // Reports
  getAttendanceReport: (params?: any) => api.get('/admin/reports/attendance', { params }),
  getPayrollReport: (params?: any) => api.get('/admin/reports/payroll', { params }),
  
  // Holiday Management
  addHoliday: (data: any) => api.post('/admin/holidays', data),
};

// Attendance API endpoints
export const attendanceApi = {
  checkIn: (data: any) => api.post('/attendance/check-in', data),
  checkOut: (data: any) => api.post('/attendance/check-out', data),
  getMyAttendance: (params?: any) => api.get('/attendance/my-attendance', { params }),
  getAllAttendance: (params?: any) => api.get('/attendance', { params }),
  updateAttendance: (id: string, data: any) => api.patch(`/attendance/${id}`, data),
};

// Leave API endpoints
export const leaveApi = {
  getMyLeaves: () => api.get('/leaves/my-leaves'),
  createLeaveRequest: (data: any) => api.post('/leaves', data),
  cancelLeaveRequest: (id: string) => api.patch(`/leaves/${id}/cancel`),
};

// Auth API endpoints
export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/user'),
};

export default api;