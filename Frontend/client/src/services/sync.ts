import axios from 'axios';
import { userStorage } from '../utils/storage';
import {
  attendanceStorage,
  leaveApplicationStorage,
  leaveQuotaStorage,
  holidayStorage,
  salaryStorage,
} from '../utils/storage';
import type {
  Attendance,
  LeaveApplication,
  LeaveQuota,
  Holiday,
  Salary,
} from '@shared/schema';

const API_BASE_URL = '/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = userStorage.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Sync service for handling data synchronization
export const syncService = {
  // Attendance sync
  syncAttendances: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/attendances`, {
        headers: getAuthHeaders(),
      });
      attendanceStorage.setAttendances(response.data);
      return response.data;
    } catch (error) {
      console.error('Error syncing attendances:', error);
      throw error;
    }
  },

  pushAttendance: async (attendance: Attendance) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/attendances`,
        attendance,
        { headers: getAuthHeaders() }
      );
      attendanceStorage.addAttendance(response.data);
      return response.data;
    } catch (error) {
      console.error('Error pushing attendance:', error);
      throw error;
    }
  },

  // Leave application sync
  syncLeaveApplications: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/leave-applications`, {
        headers: getAuthHeaders(),
      });
      leaveApplicationStorage.setLeaveApplications(response.data);
      return response.data;
    } catch (error) {
      console.error('Error syncing leave applications:', error);
      throw error;
    }
  },

  pushLeaveApplication: async (application: LeaveApplication) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/leave-applications`,
        application,
        { headers: getAuthHeaders() }
      );
      leaveApplicationStorage.addLeaveApplication(response.data);
      return response.data;
    } catch (error) {
      console.error('Error pushing leave application:', error);
      throw error;
    }
  },

  // Leave quota sync
  syncLeaveQuotas: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/leave-quotas`, {
        headers: getAuthHeaders(),
      });
      leaveQuotaStorage.setLeaveQuotas(response.data);
      return response.data;
    } catch (error) {
      console.error('Error syncing leave quotas:', error);
      throw error;
    }
  },

  pushLeaveQuota: async (quota: LeaveQuota) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/leave-quotas`,
        quota,
        { headers: getAuthHeaders() }
      );
      leaveQuotaStorage.updateLeaveQuota(quota.id, response.data);
      return response.data;
    } catch (error) {
      console.error('Error pushing leave quota:', error);
      throw error;
    }
  },

  // Holiday sync
  syncHolidays: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/holidays`, {
        headers: getAuthHeaders(),
      });
      holidayStorage.setHolidays(response.data);
      return response.data;
    } catch (error) {
      console.error('Error syncing holidays:', error);
      throw error;
    }
  },

  pushHoliday: async (holiday: Holiday) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/holidays`,
        holiday,
        { headers: getAuthHeaders() }
      );
      holidayStorage.addHoliday(response.data);
      return response.data;
    } catch (error) {
      console.error('Error pushing holiday:', error);
      throw error;
    }
  },

  // Salary sync
  syncSalaries: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/salaries`, {
        headers: getAuthHeaders(),
      });
      salaryStorage.setSalaries(response.data);
      return response.data;
    } catch (error) {
      console.error('Error syncing salaries:', error);
      throw error;
    }
  },

  pushSalary: async (salary: Salary) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/salaries`,
        salary,
        { headers: getAuthHeaders() }
      );
      salaryStorage.addSalary(response.data);
      return response.data;
    } catch (error) {
      console.error('Error pushing salary:', error);
      throw error;
    }
  },

  // Sync all data
  syncAll: async () => {
    try {
      await Promise.all([
        syncService.syncAttendances(),
        syncService.syncLeaveApplications(),
        syncService.syncLeaveQuotas(),
        syncService.syncHolidays(),
        syncService.syncSalaries(),
      ]);
    } catch (error) {
      console.error('Error syncing all data:', error);
      throw error;
    }
  },
}; 