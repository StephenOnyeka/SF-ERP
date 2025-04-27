import {
  User,
  InsertUser,
  Attendance,
  InsertAttendance,
  LeaveType,
  InsertLeaveType,
  LeaveBalance,
  InsertLeaveBalance,
  LeaveApplication,
  InsertLeaveApplication,
  Payroll,
  InsertPayroll,
  Setting,
  InsertSetting,
  Activity,
  InsertActivity,
  Announcement,
  InsertAnnouncement,
  Holiday,
  InsertHoliday
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Attendance methods
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance>;
  getAttendanceByUser(userId: number, startDate?: string, endDate?: string): Promise<Attendance[]>;
  getAttendanceByUserAndDate(userId: number, date: string): Promise<Attendance | undefined>;
  
  // Leave type methods
  createLeaveType(leaveType: InsertLeaveType): Promise<LeaveType>;
  getLeaveType(id: number): Promise<LeaveType | undefined>;
  getAllLeaveTypes(): Promise<LeaveType[]>;
  
  // Leave balance methods
  createLeaveBalance(leaveBalance: InsertLeaveBalance): Promise<LeaveBalance>;
  getLeaveBalanceByUserAndType(userId: number, leaveTypeId: number): Promise<LeaveBalance | undefined>;
  getLeaveBalancesByUser(userId: number): Promise<LeaveBalance[]>;
  incrementUsedLeaveBalance(userId: number, leaveTypeId: number, days: number): Promise<LeaveBalance>;
  initializeUserLeaveBalances(userId: number): Promise<void>;
  
  // Leave application methods
  createLeaveApplication(leaveApplication: InsertLeaveApplication): Promise<LeaveApplication>;
  getLeaveApplication(id: number): Promise<LeaveApplication | undefined>;
  getLeaveApplications(userId?: number, status?: string): Promise<LeaveApplication[]>;
  updateLeaveApplication(id: number, leaveData: Partial<LeaveApplication>): Promise<LeaveApplication>;
  
  // Payroll methods
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  getPayrollByUser(userId: number, month?: number, year?: number): Promise<Payroll[]>;
  
  // Settings methods
  createSetting(setting: InsertSetting): Promise<Setting>;
  updateSetting(id: number, settingData: Partial<Setting>): Promise<Setting>;
  getAllSettings(): Promise<Setting[]>;
  getSettingByKey(key: string): Promise<Setting | undefined>;
  
  // Activity log methods
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivities(userId?: number, limit?: number): Promise<Activity[]>;
  
  // Announcement methods
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  getAnnouncements(limit?: number): Promise<Announcement[]>;
  
  // Holiday methods
  createHoliday(holiday: InsertHoliday): Promise<Holiday>;
  getHolidaysByYear(year: number): Promise<Holiday[]>;
  
  // Report methods
  getAttendanceReport(startDate: string, endDate: string, department?: string): Promise<any[]>;
  getLeaveReport(year: number, department?: string): Promise<any[]>;
  
  // Session store for authentication
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private attendance: Map<number, Attendance>;
  private leaveTypes: Map<number, LeaveType>;
  private leaveBalances: Map<number, LeaveBalance>;
  private leaveApplications: Map<number, LeaveApplication>;
  private payroll: Map<number, Payroll>;
  private settings: Map<number, Setting>;
  private activities: Map<number, Activity>;
  private announcements: Map<number, Announcement>;
  private holidays: Map<number, Holiday>;
  
  private userIdCounter: number;
  private attendanceIdCounter: number;
  private leaveTypeIdCounter: number;
  private leaveBalanceIdCounter: number;
  private leaveApplicationIdCounter: number;
  private payrollIdCounter: number;
  private settingIdCounter: number;
  private activityIdCounter: number;
  private announcementIdCounter: number;
  private holidayIdCounter: number;
  
  public sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.attendance = new Map();
    this.leaveTypes = new Map();
    this.leaveBalances = new Map();
    this.leaveApplications = new Map();
    this.payroll = new Map();
    this.settings = new Map();
    this.activities = new Map();
    this.announcements = new Map();
    this.holidays = new Map();
    
    this.userIdCounter = 1;
    this.attendanceIdCounter = 1;
    this.leaveTypeIdCounter = 1;
    this.leaveBalanceIdCounter = 1;
    this.leaveApplicationIdCounter = 1;
    this.payrollIdCounter = 1;
    this.settingIdCounter = 1;
    this.activityIdCounter = 1;
    this.announcementIdCounter = 1;
    this.holidayIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date().toISOString();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Attendance methods
  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = this.attendanceIdCounter++;
    const attendance: Attendance = { ...insertAttendance, id };
    this.attendance.set(id, attendance);
    return attendance;
  }
  
  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance> {
    const attendance = this.attendance.get(id);
    if (!attendance) {
      throw new Error(`Attendance record with id ${id} not found`);
    }
    
    const updatedAttendance = { ...attendance, ...attendanceData };
    this.attendance.set(id, updatedAttendance);
    return updatedAttendance;
  }
  
  async getAttendanceByUser(userId: number, startDate?: string, endDate?: string): Promise<Attendance[]> {
    let records = Array.from(this.attendance.values()).filter(
      record => record.userId === userId
    );
    
    if (startDate) {
      records = records.filter(record => record.date >= startDate);
    }
    
    if (endDate) {
      records = records.filter(record => record.date <= endDate);
    }
    
    return records.sort((a, b) => (a.date > b.date ? -1 : 1));
  }
  
  async getAttendanceByUserAndDate(userId: number, date: string): Promise<Attendance | undefined> {
    return Array.from(this.attendance.values()).find(
      record => record.userId === userId && record.date === date
    );
  }

  // Leave type methods
  async createLeaveType(insertLeaveType: InsertLeaveType): Promise<LeaveType> {
    const id = this.leaveTypeIdCounter++;
    const leaveType: LeaveType = { ...insertLeaveType, id };
    this.leaveTypes.set(id, leaveType);
    return leaveType;
  }
  
  async getLeaveType(id: number): Promise<LeaveType | undefined> {
    return this.leaveTypes.get(id);
  }
  
  async getAllLeaveTypes(): Promise<LeaveType[]> {
    return Array.from(this.leaveTypes.values());
  }

  // Leave balance methods
  async createLeaveBalance(insertLeaveBalance: InsertLeaveBalance): Promise<LeaveBalance> {
    const id = this.leaveBalanceIdCounter++;
    const leaveBalance: LeaveBalance = { ...insertLeaveBalance, id };
    this.leaveBalances.set(id, leaveBalance);
    return leaveBalance;
  }
  
  async getLeaveBalanceByUserAndType(userId: number, leaveTypeId: number): Promise<LeaveBalance | undefined> {
    return Array.from(this.leaveBalances.values()).find(
      balance => balance.userId === userId && balance.leaveTypeId === leaveTypeId
    );
  }
  
  async getLeaveBalancesByUser(userId: number): Promise<LeaveBalance[]> {
    return Array.from(this.leaveBalances.values()).filter(
      balance => balance.userId === userId
    );
  }
  
  async incrementUsedLeaveBalance(userId: number, leaveTypeId: number, days: number): Promise<LeaveBalance> {
    const balance = await this.getLeaveBalanceByUserAndType(userId, leaveTypeId);
    if (!balance) {
      throw new Error(`Leave balance not found for user ${userId} and leave type ${leaveTypeId}`);
    }
    
    const updatedBalance = { 
      ...balance, 
      usedDays: balance.usedDays + days 
    };
    
    this.leaveBalances.set(balance.id, updatedBalance);
    return updatedBalance;
  }
  
  async initializeUserLeaveBalances(userId: number): Promise<void> {
    const leaveTypes = await this.getAllLeaveTypes();
    const currentYear = new Date().getFullYear();
    
    for (const leaveType of leaveTypes) {
      // Check if a balance already exists for this user and leave type
      const existingBalance = await this.getLeaveBalanceByUserAndType(userId, leaveType.id);
      
      if (!existingBalance) {
        await this.createLeaveBalance({
          userId,
          leaveTypeId: leaveType.id,
          year: currentYear,
          totalDays: leaveType.defaultDays,
          usedDays: 0
        });
      }
    }
  }

  // Leave application methods
  async createLeaveApplication(insertLeaveApplication: InsertLeaveApplication): Promise<LeaveApplication> {
    const id = this.leaveApplicationIdCounter++;
    const now = new Date().toISOString();
    const leaveApplication: LeaveApplication = { 
      ...insertLeaveApplication, 
      id,
      appliedAt: now,
      status: insertLeaveApplication.status || "pending"
    };
    this.leaveApplications.set(id, leaveApplication);
    return leaveApplication;
  }
  
  async getLeaveApplication(id: number): Promise<LeaveApplication | undefined> {
    return this.leaveApplications.get(id);
  }
  
  async getLeaveApplications(userId?: number, status?: string): Promise<LeaveApplication[]> {
    let applications = Array.from(this.leaveApplications.values());
    
    if (userId !== undefined) {
      applications = applications.filter(app => app.userId === userId);
    }
    
    if (status) {
      applications = applications.filter(app => app.status === status);
    }
    
    return applications.sort((a, b) => (a.appliedAt > b.appliedAt ? -1 : 1));
  }
  
  async updateLeaveApplication(id: number, leaveData: Partial<LeaveApplication>): Promise<LeaveApplication> {
    const application = this.leaveApplications.get(id);
    if (!application) {
      throw new Error(`Leave application with id ${id} not found`);
    }
    
    const updatedApplication = { ...application, ...leaveData };
    this.leaveApplications.set(id, updatedApplication);
    return updatedApplication;
  }

  // Payroll methods
  async createPayroll(insertPayroll: InsertPayroll): Promise<Payroll> {
    const id = this.payrollIdCounter++;
    const payroll: Payroll = { ...insertPayroll, id };
    this.payroll.set(id, payroll);
    return payroll;
  }
  
  async getPayrollByUser(userId: number, month?: number, year?: number): Promise<Payroll[]> {
    let records = Array.from(this.payroll.values()).filter(
      record => record.userId === userId
    );
    
    if (month !== undefined) {
      records = records.filter(record => record.month === month);
    }
    
    if (year !== undefined) {
      records = records.filter(record => record.year === year);
    }
    
    return records.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }

  // Settings methods
  async createSetting(insertSetting: InsertSetting): Promise<Setting> {
    const id = this.settingIdCounter++;
    const now = new Date().toISOString();
    const setting: Setting = { 
      ...insertSetting, 
      id,
      updatedAt: now
    };
    this.settings.set(id, setting);
    return setting;
  }
  
  async updateSetting(id: number, settingData: Partial<Setting>): Promise<Setting> {
    const setting = this.settings.get(id);
    if (!setting) {
      throw new Error(`Setting with id ${id} not found`);
    }
    
    const now = new Date().toISOString();
    const updatedSetting = { 
      ...setting, 
      ...settingData,
      updatedAt: now
    };
    
    this.settings.set(id, updatedSetting);
    return updatedSetting;
  }
  
  async getAllSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }
  
  async getSettingByKey(key: string): Promise<Setting | undefined> {
    return Array.from(this.settings.values()).find(
      setting => setting.key === key
    );
  }

  // Activity log methods
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const now = new Date().toISOString();
    const activity: Activity = { 
      ...insertActivity, 
      id,
      timestamp: now
    };
    this.activities.set(id, activity);
    return activity;
  }
  
  async getActivities(userId?: number, limit: number = 10): Promise<Activity[]> {
    let activities = Array.from(this.activities.values());
    
    if (userId !== undefined) {
      activities = activities.filter(activity => activity.userId === userId);
    }
    
    return activities
      .sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1))
      .slice(0, limit);
  }

  // Announcement methods
  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const id = this.announcementIdCounter++;
    const now = new Date().toISOString();
    const announcement: Announcement = { 
      ...insertAnnouncement, 
      id,
      createdAt: now
    };
    this.announcements.set(id, announcement);
    return announcement;
  }
  
  async getAnnouncements(limit: number = 5): Promise<Announcement[]> {
    const now = new Date().toISOString();
    
    return Array.from(this.announcements.values())
      .filter(announcement => !announcement.expiresAt || announcement.expiresAt > now)
      .sort((a, b) => {
        // Sort by priority first
        if (a.priority !== b.priority) {
          if (a.priority === "high") return -1;
          if (b.priority === "high") return 1;
          if (a.priority === "normal") return -1;
          return 1;
        }
        // Then by creation date
        return a.createdAt > b.createdAt ? -1 : 1;
      })
      .slice(0, limit);
  }

  // Holiday methods
  async createHoliday(insertHoliday: InsertHoliday): Promise<Holiday> {
    const id = this.holidayIdCounter++;
    const holiday: Holiday = { ...insertHoliday, id };
    this.holidays.set(id, holiday);
    return holiday;
  }
  
  async getHolidaysByYear(year: number): Promise<Holiday[]> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    return Array.from(this.holidays.values())
      .filter(holiday => {
        // Include recurring holidays
        if (holiday.isRecurring) {
          const holidayDate = new Date(holiday.date);
          const holidayMonth = holidayDate.getMonth() + 1;
          const holidayDay = holidayDate.getDate();
          
          // Create the date for this year and check if it matches
          const thisYearDate = new Date(year, holidayMonth - 1, holidayDay);
          return thisYearDate.getFullYear() === year;
        }
        
        // Include non-recurring holidays for this year
        return holiday.date >= startDate && holiday.date <= endDate;
      })
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }

  // Report methods
  async getAttendanceReport(startDate: string, endDate: string, department?: string): Promise<any[]> {
    // Get all attendance records in the date range
    let records = Array.from(this.attendance.values()).filter(
      record => record.date >= startDate && record.date <= endDate
    );
    
    // Get all users
    let users = await this.getAllUsers();
    
    // Filter by department if specified
    if (department) {
      users = users.filter(user => user.department === department);
    }
    
    // Prepare report data
    const report = users.map(user => {
      const userRecords = records.filter(record => record.userId === user.id);
      
      // Calculate statistics
      const totalDays = userRecords.length;
      const presentDays = userRecords.filter(r => r.status === "present").length;
      const absentDays = userRecords.filter(r => r.status === "absent").length;
      const lateDays = userRecords.filter(r => {
        if (!r.timeIn) return false;
        
        // Consider late if clock in after 9:30 AM (assuming standard work time)
        const [hours, minutes] = r.timeIn.split(":").map(Number);
        return hours > 9 || (hours === 9 && minutes > 30);
      }).length;
      
      return {
        userId: user.id,
        userName: user.fullName,
        department: user.department,
        position: user.position,
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendanceRate: totalDays ? (presentDays / totalDays) * 100 : 0
      };
    });
    
    return report;
  }
  
  async getLeaveReport(year: number, department?: string): Promise<any[]> {
    // Get all leave applications for the year
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    let applications = Array.from(this.leaveApplications.values()).filter(
      app => app.startDate >= startDate && app.startDate <= endDate && app.status === "approved"
    );
    
    // Get all users
    let users = await this.getAllUsers();
    
    // Filter by department if specified
    if (department) {
      users = users.filter(user => user.department === department);
    }
    
    // Get all leave types
    const leaveTypes = await this.getAllLeaveTypes();
    
    // Prepare report data
    const report = users.map(user => {
      const userApplications = applications.filter(app => app.userId === user.id);
      
      // Calculate leave days by type
      const leaveByType = leaveTypes.map(type => {
        const typeApplications = userApplications.filter(app => app.leaveTypeId === type.id);
        let totalDays = 0;
        
        typeApplications.forEach(app => {
          const startDate = new Date(app.startDate);
          const endDate = new Date(app.endDate);
          const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
          totalDays += dayDiff;
        });
        
        return {
          leaveTypeId: type.id,
          leaveTypeName: type.name,
          totalDays
        };
      });
      
      // Get leave balances
      const leaveBalances = Array.from(this.leaveBalances.values())
        .filter(balance => balance.userId === user.id && balance.year === year)
        .map(balance => {
          const leaveType = leaveTypes.find(type => type.id === balance.leaveTypeId);
          return {
            leaveTypeId: balance.leaveTypeId,
            leaveTypeName: leaveType?.name || "Unknown",
            totalDays: balance.totalDays,
            usedDays: balance.usedDays,
            remainingDays: balance.totalDays - balance.usedDays
          };
        });
      
      return {
        userId: user.id,
        userName: user.fullName,
        department: user.department,
        position: user.position,
        leaveByType,
        leaveBalances
      };
    });
    
    return report;
  }
}

export const storage = new MemStorage();
