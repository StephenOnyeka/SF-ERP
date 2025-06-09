export const API_BASE_URL = 'http://localhost:3000';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/login`,
    REGISTER: `${API_BASE_URL}/api/register`,
    LOGOUT: `${API_BASE_URL}/api/logout`,
    ME: `${API_BASE_URL}/api/user`,
  },
  USERS: {
    LIST: `${API_BASE_URL}/api/users`,
    DETAIL: (id: string) => `${API_BASE_URL}/api/users/${id}`,
  },
  ATTENDANCE: {
    LIST: `${API_BASE_URL}/api/attendance`,
    CLOCK_IN: `${API_BASE_URL}/api/attendance/clock-in`,
    CLOCK_OUT: `${API_BASE_URL}/api/attendance/clock-out`,
  },
  LEAVE: {
    APPLICATIONS: `${API_BASE_URL}/api/leave-applications`,
    QUOTAS: `${API_BASE_URL}/api/leave-quotas`,
  },
  HOLIDAYS: `${API_BASE_URL}/api/holidays`,
  SALARY: `${API_BASE_URL}/api/salary`,
}; 