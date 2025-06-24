import { User, Attendance, LeaveApplication, LeaveQuota, Holiday, Salary } from '@shared/schema';

// Storage keys
const STORAGE_KEYS = {
  USER: 'user',
  TOKEN: 'token',
  ATTENDANCES: 'attendances',
  LEAVE_APPLICATIONS: 'leave_applications',
  LEAVE_QUOTAS: 'leave_quotas',
  HOLIDAYS: 'holidays',
  SALARIES: 'salaries',
  SETTINGS: 'settings',
} as const;

// Generic storage functions
export const storage = {
  set: <T>(key: string, value: T): void => {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  get: <T>(key: string, defaultValue: T): T => {
    try {
      const serializedValue = localStorage.getItem(key);
      return serializedValue ? JSON.parse(serializedValue) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// User related storage functions
export const userStorage = {
  setUser: (user: User): void => {
    storage.set(STORAGE_KEYS.USER, user);
  },

  getUser: (): User | null => {
    return storage.get(STORAGE_KEYS.USER, null);
  },

  setToken: (token: string): void => {
    storage.set(STORAGE_KEYS.TOKEN, token);
  },

  getToken: (): string | null => {
    return storage.get(STORAGE_KEYS.TOKEN, null);
  },

  clearUser: (): void => {
    storage.remove(STORAGE_KEYS.USER);
    storage.remove(STORAGE_KEYS.TOKEN);
  },
};

// Attendance related storage functions
export const attendanceStorage = {
  setAttendances: (attendances: Attendance[]): void => {
    storage.set(STORAGE_KEYS.ATTENDANCES, attendances);
  },

  getAttendances: (): Attendance[] => {
    return storage.get(STORAGE_KEYS.ATTENDANCES, []);
  },

  addAttendance: (attendance: Attendance): void => {
    const attendances = attendanceStorage.getAttendances();
    attendances.push(attendance);
    attendanceStorage.setAttendances(attendances);
  },

  updateAttendance: (id: string, updatedAttendance: Attendance): void => {
    const attendances = attendanceStorage.getAttendances();
    const index = attendances.findIndex(a => a.id === id);
    if (index !== -1) {
      attendances[index] = updatedAttendance;
      attendanceStorage.setAttendances(attendances);
    }
  },
};

// Leave application related storage functions
export const leaveApplicationStorage = {
  setLeaveApplications: (applications: LeaveApplication[]): void => {
    storage.set(STORAGE_KEYS.LEAVE_APPLICATIONS, applications);
  },

  getLeaveApplications: (): LeaveApplication[] => {
    return storage.get(STORAGE_KEYS.LEAVE_APPLICATIONS, []);
  },

  addLeaveApplication: (application: LeaveApplication): void => {
    const applications = leaveApplicationStorage.getLeaveApplications();
    applications.push(application);
    leaveApplicationStorage.setLeaveApplications(applications);
  },

  updateLeaveApplication: (id: string, updatedApplication: LeaveApplication): void => {
    const applications = leaveApplicationStorage.getLeaveApplications();
    const index = applications.findIndex(a => a.id === id);
    if (index !== -1) {
      applications[index] = updatedApplication;
      leaveApplicationStorage.setLeaveApplications(applications);
    }
  },
};

// Leave quota related storage functions
export const leaveQuotaStorage = {
  setLeaveQuotas: (quotas: LeaveQuota[]): void => {
    storage.set(STORAGE_KEYS.LEAVE_QUOTAS, quotas);
  },

  getLeaveQuotas: (): LeaveQuota[] => {
    return storage.get(STORAGE_KEYS.LEAVE_QUOTAS, []);
  },

  updateLeaveQuota: (id: string, updatedQuota: LeaveQuota): void => {
    const quotas = leaveQuotaStorage.getLeaveQuotas();
    const index = quotas.findIndex(q => q.id === id);
    if (index !== -1) {
      quotas[index] = updatedQuota;
      leaveQuotaStorage.setLeaveQuotas(quotas);
    }
  },
};

// Holiday related storage functions
export const holidayStorage = {
  setHolidays: (holidays: Holiday[]): void => {
    storage.set(STORAGE_KEYS.HOLIDAYS, holidays);
  },

  getHolidays: (): Holiday[] => {
    return storage.get(STORAGE_KEYS.HOLIDAYS, []);
  },

  addHoliday: (holiday: Holiday): void => {
    const holidays = holidayStorage.getHolidays();
    holidays.push(holiday);
    holidayStorage.setHolidays(holidays);
  },

  updateHoliday: (id: string, updatedHoliday: Holiday): void => {
    const holidays = holidayStorage.getHolidays();
    const index = holidays.findIndex(h => h.id === id);
    if (index !== -1) {
      holidays[index] = updatedHoliday;
      holidayStorage.setHolidays(holidays);
    }
  },
};

// Salary related storage functions
export const salaryStorage = {
  setSalaries: (salaries: Salary[]): void => {
    storage.set(STORAGE_KEYS.SALARIES, salaries);
  },

  getSalaries: (): Salary[] => {
    return storage.get(STORAGE_KEYS.SALARIES, []);
  },

  addSalary: (salary: Salary): void => {
    const salaries = salaryStorage.getSalaries();
    salaries.push(salary);
    salaryStorage.setSalaries(salaries);
  },

  updateSalary: (id: string, updatedSalary: Salary): void => {
    const salaries = salaryStorage.getSalaries();
    const index = salaries.findIndex(s => s.id === id);
    if (index !== -1) {
      salaries[index] = updatedSalary;
      salaryStorage.setSalaries(salaries);
    }
  },
};

// Settings related storage functions
export const settingsStorage = {
  setSettings: (settings: Record<string, any>): void => {
    storage.set(STORAGE_KEYS.SETTINGS, settings);
  },

  getSettings: (): Record<string, any> => {
    return storage.get(STORAGE_KEYS.SETTINGS, {});
  },

  updateSettings: (key: string, value: any): void => {
    const settings = settingsStorage.getSettings();
    settings[key] = value;
    settingsStorage.setSettings(settings);
  },
}; 