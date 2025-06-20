export const API_BASE_URL = 'http://localhost:3000';
// export const API_BASE_URL = 'http://localhost:5000';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `/api/login`,
    REGISTER: `/api/register`,
    LOGOUT: `/api/logout`,
    ME: `/api/user`,
  },
  USERS: {
    LIST: `/api/users`,
    DETAIL: (id: string) => `/api/users/${id}`,
  },
  ATTENDANCE: {
    LIST: `/api/attendance`,
    CLOCK_IN: `/api/attendance/clock-in`,
    CLOCK_OUT: `/api/attendance/clock-out`,
  },
  LEAVE: {
    APPLICATIONS: `/api/leave-applications`,
    QUOTAS: `/api/leave-quotas`,
  },
  HOLIDAYS: `/api/holidays`,
  SALARY: `/api/salary`,
}; 