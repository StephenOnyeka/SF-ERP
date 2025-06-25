import session from "express-session";
import createMemoryStore from "memorystore";
import { 
  User, Attendance, 
  LeaveType, LeaveQuota,
  LeaveApplication, Holiday,
  Salary 
} from "@shared/schema";
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const MemoryStore = createMemoryStore(session);

// Define the storage interface
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: User): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  
  // Attendance operations
  getAttendance(id: string): Promise<Attendance | undefined>;
  getAttendancesByUserId(userId: string): Promise<Attendance[]>;
  getAttendancesByDate(date: Date): Promise<Attendance[]>;
  getAttendancesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Attendance[]>;
  createAttendance(attendance: Attendance): Promise<Attendance>;
  updateAttendance(id: string, attendance: Partial<Attendance>): Promise<Attendance | undefined>;
  
  // Leave type operations
  getLeaveType(id: string): Promise<LeaveType | undefined>;
  getAllLeaveTypes(): Promise<LeaveType[]>;
  createLeaveType(leaveType: LeaveType): Promise<LeaveType>;
  
  // Leave quota operations
  getLeaveQuota(id: string): Promise<LeaveQuota | undefined>;
  getLeaveQuotasByUserId(userId: string): Promise<LeaveQuota[]>;
  createLeaveQuota(leaveQuota: LeaveQuota): Promise<LeaveQuota>;
  updateLeaveQuota(id: string, leaveQuota: Partial<LeaveQuota>): Promise<LeaveQuota | undefined>;
  
  // Leave application operations
  getLeaveApplication(id: string): Promise<LeaveApplication | undefined>;
  getLeaveApplicationsByUserId(userId: string): Promise<LeaveApplication[]>;
  createLeaveApplication(leaveApplication: LeaveApplication): Promise<LeaveApplication>;
  updateLeaveApplication(id: string, leaveApplication: Partial<LeaveApplication>): Promise<LeaveApplication | undefined>;
  
  // Holiday operations
  getHoliday(id: string): Promise<Holiday | undefined>;
  getAllHolidays(): Promise<Holiday[]>;
  createHoliday(holiday: Holiday): Promise<Holiday>;
  
  // Salary operations
  getSalary(id: string): Promise<Salary | undefined>;
  getSalariesByUserId(userId: string): Promise<Salary[]>;
  createSalary(salary: Salary): Promise<Salary>;
  updateSalary(id: string, salary: Partial<Salary>): Promise<Salary | undefined>;
  
  // Session store
  sessionStore: any;

  // New methods
  getAllLeaveApplications(): Promise<LeaveApplication[]>;
  getAllLeaveQuotas(): Promise<LeaveQuota[]>;
  getAllSalaries(): Promise<Salary[]>;
  getAllAttendances(): Promise<Attendance[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private attendances: Map<string, Attendance>;
  private leaveTypes: Map<string, LeaveType>;
  private leaveQuotas: Map<string, LeaveQuota>;
  private leaveApplications: Map<string, LeaveApplication>;
  private holidays: Map<string, Holiday>;
  private salaries: Map<string, Salary>;

  sessionStore: any;

  constructor() {
    this.users = new Map();
    this.attendances = new Map();
    this.leaveTypes = new Map();
    this.leaveQuotas = new Map();
    this.leaveApplications = new Map();
    this.holidays = new Map();
    this.salaries = new Map();

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });

    // Initialize with default leave types
    this.initializeLeaveTypes();
    this.initializeHolidays();

    // Create demo admin user
    console.log("Creating demo admin user...");
    this.createDemoUsers();
  }

  private initializeLeaveTypes() {
    const leaveTypes = [
      { name: "Paid Leave", description: "Annual paid leave", colorCode: "#3B82F6" },
      { name: "Sick Leave", description: "Leave for health issues", colorCode: "#10B981" },
      { name: "Casual Leave", description: "Short notice leave", colorCode: "#6366F1" }
    ];

    leaveTypes.forEach(type => {
      this.createLeaveType(type as LeaveType); // Remove InsertLeaveType
    });
  }

  private initializeHolidays() {
    const today = new Date();
    const year = today.getFullYear();

    const holidays = [
      { name: "Independence Day", date: new Date(year, 7, 15), description: "National holiday", type: "national" },
      { name: "Gandhi Jayanti", date: new Date(year, 9, 2), description: "National holiday", type: "national" },
      { name: "Diwali", date: new Date(year, 9, 24), description: "Festival", type: "festival" }
    ];

    holidays.forEach(holiday => {
      this.createHoliday(holiday as Holiday); // Remove InsertHoliday
    });
  }
  
  private async createDemoUsers() {
    try {
      // Create a default admin user for testing
      const adminUser = {
        username: "admin",
        password: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm", // "password" hashed
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        role: "admin" as const,
        department: "Administration",
        position: "System Administrator",
        joinDate: new Date(),
        companyId: "SF-001"
      };
      const user = await this.createUser(adminUser);
      console.log("Demo admin user created:", user.username, "CompanyID:", user.companyId);
      // Create an HR user for testing
      const hrUser = {
        username: "hr",
        password: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm", // "password" hashed
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@example.com",
        role: "hr" as const,
        department: "Human Resources",
        position: "HR Manager",
        joinDate: new Date(),
        companyId: "SF-002"
      };
      const hr = await this.createUser(hrUser);
      console.log("Demo HR user created:", hr.username, "CompanyID:", hr.companyId);
      // Create employee users for testing
      const employee1 = {
        username: "employee",
        password: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm", // "password" hashed
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        role: "employee" as const,
        department: "Engineering",
        position: "Software Developer",
        joinDate: new Date(),
        companyId: "SF-004"
      };
      const employee1Result = await this.createUser(employee1);
      console.log("Demo employee user created:", employee1Result.username, "CompanyID:", employee1Result.companyId);
      const employee2 = {
        username: "employee2",
        password: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm", // "password" hashed
        firstName: "Jane",
        lastName: "Doe",
        email: "jane.doe@example.com",
        role: "employee" as const,
        department: "Marketing",
        position: "Marketing Specialist",
        joinDate: new Date(),
        companyId: "SF-005"
      };
      const employee2Result = await this.createUser(employee2);
      console.log("Demo employee user created:", employee2Result.username, "CompanyID:", employee2Result.companyId);
    } catch (error) {
      console.error("Error creating demo users:", error);
    }
  }
  
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const id = uuidv4();
    const user: User = {
      ...userData,
      id,
      joinDate: userData.joinDate ? new Date(userData.joinDate) : new Date(),
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    const deleted = this.users.delete(id);
    // Remove associated records
    const attendanceRecords = await this.getAttendancesByUserId(id);
    attendanceRecords.forEach(record => {
      if (record.id) this.attendances.delete(record.id);
    });
    const leaveQuotas = await this.getLeaveQuotasByUserId(id);
    leaveQuotas.forEach(quota => {
      if (quota.id) this.leaveQuotas.delete(quota.id);
    });
    const leaveApplications = await this.getLeaveApplicationsByUserId(id);
    leaveApplications.forEach(application => {
      if (application.id) this.leaveApplications.delete(application.id);
    });
    const salaries = await this.getSalariesByUserId(id);
    salaries.forEach(salary => {
      if (salary.id) this.salaries.delete(salary.id);
    });
    return deleted;
  }
  
  // Attendance operations
  async getAttendance(id: string): Promise<Attendance | undefined> {
    return this.attendances.get(id);
  }
  
  async getAttendancesByUserId(userId: string): Promise<Attendance[]> {
    return Array.from(this.attendances.values())
      .filter(attendance => attendance.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getAttendancesByDate(date: Date): Promise<Attendance[]> {
    const dateString = date.toISOString().split('T')[0];
    return Array.from(this.attendances.values())
      .filter(attendance => {
        const attendanceDateString = new Date(attendance.date).toISOString().split('T')[0];
        return attendanceDateString === dateString;
      });
  }
  
  async getAttendancesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Attendance[]> {
    const start = startDate.getTime();
    const end = endDate.getTime();
    
    return Array.from(this.attendances.values())
      .filter(attendance => {
        const attendanceDate = new Date(attendance.date).getTime();
        return attendance.userId === userId && attendanceDate >= start && attendanceDate <= end;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async createAttendance(attendanceData: Omit<Attendance, 'id'>): Promise<Attendance> {
    const id = uuidv4();
    const attendance: Attendance = { ...attendanceData, id };
    this.attendances.set(id, attendance);
    return attendance;
  }
  
  async updateAttendance(id: string, attendanceData: Partial<Attendance>): Promise<Attendance | undefined> {
    const attendance = this.attendances.get(id);
    if (!attendance) return undefined;
    
    const updatedAttendance = { ...attendance, ...attendanceData };
    this.attendances.set(id, updatedAttendance);
    return updatedAttendance;
  }
  
  // Leave type operations
  async getLeaveType(id: string): Promise<LeaveType | undefined> {
    return this.leaveTypes.get(id);
  }
  
  async getAllLeaveTypes(): Promise<LeaveType[]> {
    return Array.from(this.leaveTypes.values());
  }
  
  async createLeaveType(leaveTypeData: Omit<LeaveType, 'id'>): Promise<LeaveType> {
    const id = uuidv4();
    const leaveType: LeaveType = { ...leaveTypeData, id };
    this.leaveTypes.set(id, leaveType);
    return leaveType;
  }
  
  // Leave quota operations
  async getLeaveQuota(id: string): Promise<LeaveQuota | undefined> {
    return this.leaveQuotas.get(id);
  }
  
  async getLeaveQuotasByUserId(userId: string): Promise<LeaveQuota[]> {
    return Array.from(this.leaveQuotas.values())
      .filter(quota => quota.userId === userId);
  }
  
  async createLeaveQuota(leaveQuotaData: Omit<LeaveQuota, 'id'>): Promise<LeaveQuota> {
    const id = uuidv4();
    const leaveQuota: LeaveQuota = { ...leaveQuotaData, id };
    this.leaveQuotas.set(id, leaveQuota);
    return leaveQuota;
  }
  
  async updateLeaveQuota(id: string, leaveQuotaData: Partial<LeaveQuota>): Promise<LeaveQuota | undefined> {
    const leaveQuota = this.leaveQuotas.get(id);
    if (!leaveQuota) return undefined;
    
    const updatedLeaveQuota = { ...leaveQuota, ...leaveQuotaData };
    this.leaveQuotas.set(id, updatedLeaveQuota);
    return updatedLeaveQuota;
  }
  
  // Leave application operations
  async getLeaveApplication(id: string): Promise<LeaveApplication | undefined> {
    return this.leaveApplications.get(id);
  }
  
  async getLeaveApplicationsByUserId(userId: string): Promise<LeaveApplication[]> {
    return Array.from(this.leaveApplications.values())
      .filter(application => application.userId === userId)
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }
  
  async createLeaveApplication(leaveApplicationData: Omit<LeaveApplication, 'id'>): Promise<LeaveApplication> {
    const id = uuidv4();
    const leaveApplication: LeaveApplication = { ...leaveApplicationData, id };
    this.leaveApplications.set(id, leaveApplication);
    return leaveApplication;
  }
  
  async updateLeaveApplication(id: string, leaveApplicationData: Partial<LeaveApplication>): Promise<LeaveApplication | undefined> {
    const leaveApplication = this.leaveApplications.get(id);
    if (!leaveApplication) return undefined;
    
    const updatedLeaveApplication = { ...leaveApplication, ...leaveApplicationData };
    this.leaveApplications.set(id, updatedLeaveApplication);
    return updatedLeaveApplication;
  }
  
  // Holiday operations
  async getHoliday(id: string): Promise<Holiday | undefined> {
    return this.holidays.get(id);
  }
  
  async getAllHolidays(): Promise<Holiday[]> {
    return Array.from(this.holidays.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async createHoliday(holidayData: Omit<Holiday, 'id'>): Promise<Holiday> {
    const id = uuidv4();
    const holiday: Holiday = { ...holidayData, id };
    this.holidays.set(id, holiday);
    return holiday;
  }
  
  // Salary operations
  async getSalary(id: string): Promise<Salary | undefined> {
    return this.salaries.get(id);
  }
  
  async getSalariesByUserId(userId: string): Promise<Salary[]> {
    return Array.from(this.salaries.values())
      .filter(salary => salary.userId === userId)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }
  
  async createSalary(salaryData: Omit<Salary, 'id'>): Promise<Salary> {
    const id = uuidv4();
    const salary: Salary = { ...salaryData, id };
    this.salaries.set(id, salary);
    return salary;
  }
  
  async updateSalary(id: string, salaryData: Partial<Salary>): Promise<Salary | undefined> {
    const salary = this.salaries.get(id);
    if (!salary) return undefined;
    
    const updatedSalary = { ...salary, ...salaryData };
    this.salaries.set(id, updatedSalary);
    return updatedSalary;
  }

  async getAllLeaveApplications(): Promise<LeaveApplication[]> {
    return Array.from(this.leaveApplications.values());
  }

  async getAllLeaveQuotas(): Promise<LeaveQuota[]> {
    return Array.from(this.leaveQuotas.values());
  }

  async getAllSalaries(): Promise<Salary[]> {
    return Array.from(this.salaries.values());
  }

  async getAllAttendances(): Promise<Attendance[]> {
    return Array.from(this.attendances.values());
  }
}

export const storage = new MemStorage();
