import session from "express-session";
import createMemoryStore from "memorystore";
import { 
  User, InsertUser, Attendance, InsertAttendance, 
  LeaveType, InsertLeaveType, LeaveQuota, InsertLeaveQuota,
  LeaveApplication, InsertLeaveApplication, Holiday, InsertHoliday,
  Salary, InsertSalary 
} from "@shared/schema";

const MemoryStore = createMemoryStore(session);

// Define the storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Attendance operations
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendancesByUserId(userId: number): Promise<Attendance[]>;
  getAttendancesByDate(date: Date): Promise<Attendance[]>;
  getAttendancesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<Attendance>): Promise<Attendance | undefined>;
  
  // Leave type operations
  getLeaveType(id: number): Promise<LeaveType | undefined>;
  getAllLeaveTypes(): Promise<LeaveType[]>;
  createLeaveType(leaveType: InsertLeaveType): Promise<LeaveType>;
  
  // Leave quota operations
  getLeaveQuota(id: number): Promise<LeaveQuota | undefined>;
  getLeaveQuotasByUserId(userId: number): Promise<LeaveQuota[]>;
  createLeaveQuota(leaveQuota: InsertLeaveQuota): Promise<LeaveQuota>;
  updateLeaveQuota(id: number, leaveQuota: Partial<LeaveQuota>): Promise<LeaveQuota | undefined>;
  
  // Leave application operations
  getLeaveApplication(id: number): Promise<LeaveApplication | undefined>;
  getLeaveApplicationsByUserId(userId: number): Promise<LeaveApplication[]>;
  createLeaveApplication(leaveApplication: InsertLeaveApplication): Promise<LeaveApplication>;
  updateLeaveApplication(id: number, leaveApplication: Partial<LeaveApplication>): Promise<LeaveApplication | undefined>;
  
  // Holiday operations
  getHoliday(id: number): Promise<Holiday | undefined>;
  getAllHolidays(): Promise<Holiday[]>;
  createHoliday(holiday: InsertHoliday): Promise<Holiday>;
  
  // Salary operations
  getSalary(id: number): Promise<Salary | undefined>;
  getSalariesByUserId(userId: number): Promise<Salary[]>;
  createSalary(salary: InsertSalary): Promise<Salary>;
  updateSalary(id: number, salary: Partial<Salary>): Promise<Salary | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private attendances: Map<number, Attendance>;
  private leaveTypes: Map<number, LeaveType>;
  private leaveQuotas: Map<number, LeaveQuota>;
  private leaveApplications: Map<number, LeaveApplication>;
  private holidays: Map<number, Holiday>;
  private salaries: Map<number, Salary>;
  
  private userId: number;
  private attendanceId: number;
  private leaveTypeId: number;
  private leaveQuotaId: number;
  private leaveApplicationId: number;
  private holidayId: number;
  private salaryId: number;
  
  sessionStore: session.SessionStore;
  
  constructor() {
    this.users = new Map();
    this.attendances = new Map();
    this.leaveTypes = new Map();
    this.leaveQuotas = new Map();
    this.leaveApplications = new Map();
    this.holidays = new Map();
    this.salaries = new Map();
    
    this.userId = 1;
    this.attendanceId = 1;
    this.leaveTypeId = 1;
    this.leaveQuotaId = 1;
    this.leaveApplicationId = 1;
    this.holidayId = 1;
    this.salaryId = 1;
    
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
      this.createLeaveType(type as InsertLeaveType);
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
      this.createHoliday(holiday as InsertHoliday);
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
        role: "admin",
        department: "Administration",
        position: "System Administrator",
        joinDate: new Date().toISOString(),
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
        role: "hr",
        department: "Human Resources",
        position: "HR Manager",
        joinDate: new Date().toISOString(),
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
        role: "employee",
        department: "Engineering",
        position: "Software Developer",
        joinDate: new Date().toISOString(),
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
        role: "employee",
        department: "Marketing",
        position: "Marketing Specialist",
        joinDate: new Date().toISOString(),
        companyId: "SF-005"
      };
      
      const employee2Result = await this.createUser(employee2);
      console.log("Demo employee user created:", employee2Result.username, "CompanyID:", employee2Result.companyId);
    } catch (error) {
      console.error("Error creating demo users:", error);
    }
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    
    // Auto-generate company ID if not provided
    let companyId = userData.companyId;
    if (!companyId) {
      // Find the highest existing company ID
      const users = await this.getAllUsers();
      let maxId = 0;
      
      users.forEach(user => {
        if (user.companyId) {
          const idNumber = parseInt(user.companyId.split('-')[1]);
          if (!isNaN(idNumber) && idNumber > maxId) {
            maxId = idNumber;
          }
        }
      });
      
      // Generate next company ID
      companyId = `SF-${String(maxId + 1).padStart(3, '0')}`;
      console.log(`Generated new company ID: ${companyId}`);
    }
    
    const user: User = { ...userData, id, companyId };
    this.users.set(id, user);
    
    // Create default leave quotas for new user
    const leaveTypes = await this.getAllLeaveTypes();
    const currentYear = new Date().getFullYear();
    
    leaveTypes.forEach(leaveType => {
      let totalQuota = 20; // Default quota for Paid Leave
      
      if (leaveType.name === "Sick Leave") totalQuota = 10;
      if (leaveType.name === "Casual Leave") totalQuota = 8;
      
      this.createLeaveQuota({
        userId: id,
        leaveTypeId: leaveType.id,
        totalQuota,
        usedQuota: 0,
        year: currentYear
      });
    });
    
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // Check if user exists
    const user = this.users.get(id);
    if (!user) return false;
    
    // Delete user
    const deleted = this.users.delete(id);
    
    // Remove associated records like attendance, leave quotas, etc.
    // This is a simplified implementation - in a real system, you might want
    // to handle these operations differently
    
    // Delete attendance records
    const attendanceRecords = await this.getAttendancesByUserId(id);
    attendanceRecords.forEach(record => {
      this.attendances.delete(record.id);
    });
    
    // Delete leave quotas
    const leaveQuotas = await this.getLeaveQuotasByUserId(id);
    leaveQuotas.forEach(quota => {
      this.leaveQuotas.delete(quota.id);
    });
    
    // Delete leave applications
    const leaveApplications = await this.getLeaveApplicationsByUserId(id);
    leaveApplications.forEach(application => {
      this.leaveApplications.delete(application.id);
    });
    
    // Delete salary records
    const salaries = await this.getSalariesByUserId(id);
    salaries.forEach(salary => {
      this.salaries.delete(salary.id);
    });
    
    return deleted;
  }
  
  // Attendance operations
  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendances.get(id);
  }
  
  async getAttendancesByUserId(userId: number): Promise<Attendance[]> {
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
  
  async getAttendancesByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Attendance[]> {
    const start = startDate.getTime();
    const end = endDate.getTime();
    
    return Array.from(this.attendances.values())
      .filter(attendance => {
        const attendanceDate = new Date(attendance.date).getTime();
        return attendance.userId === userId && attendanceDate >= start && attendanceDate <= end;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const id = this.attendanceId++;
    const attendance: Attendance = { ...attendanceData, id };
    this.attendances.set(id, attendance);
    return attendance;
  }
  
  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance | undefined> {
    const attendance = this.attendances.get(id);
    if (!attendance) return undefined;
    
    const updatedAttendance = { ...attendance, ...attendanceData };
    this.attendances.set(id, updatedAttendance);
    return updatedAttendance;
  }
  
  // Leave type operations
  async getLeaveType(id: number): Promise<LeaveType | undefined> {
    return this.leaveTypes.get(id);
  }
  
  async getAllLeaveTypes(): Promise<LeaveType[]> {
    return Array.from(this.leaveTypes.values());
  }
  
  async createLeaveType(leaveTypeData: InsertLeaveType): Promise<LeaveType> {
    const id = this.leaveTypeId++;
    const leaveType: LeaveType = { ...leaveTypeData, id };
    this.leaveTypes.set(id, leaveType);
    return leaveType;
  }
  
  // Leave quota operations
  async getLeaveQuota(id: number): Promise<LeaveQuota | undefined> {
    return this.leaveQuotas.get(id);
  }
  
  async getLeaveQuotasByUserId(userId: number): Promise<LeaveQuota[]> {
    return Array.from(this.leaveQuotas.values())
      .filter(quota => quota.userId === userId);
  }
  
  async createLeaveQuota(leaveQuotaData: InsertLeaveQuota): Promise<LeaveQuota> {
    const id = this.leaveQuotaId++;
    const leaveQuota: LeaveQuota = { ...leaveQuotaData, id };
    this.leaveQuotas.set(id, leaveQuota);
    return leaveQuota;
  }
  
  async updateLeaveQuota(id: number, leaveQuotaData: Partial<LeaveQuota>): Promise<LeaveQuota | undefined> {
    const leaveQuota = this.leaveQuotas.get(id);
    if (!leaveQuota) return undefined;
    
    const updatedLeaveQuota = { ...leaveQuota, ...leaveQuotaData };
    this.leaveQuotas.set(id, updatedLeaveQuota);
    return updatedLeaveQuota;
  }
  
  // Leave application operations
  async getLeaveApplication(id: number): Promise<LeaveApplication | undefined> {
    return this.leaveApplications.get(id);
  }
  
  async getLeaveApplicationsByUserId(userId: number): Promise<LeaveApplication[]> {
    return Array.from(this.leaveApplications.values())
      .filter(application => application.userId === userId)
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }
  
  async createLeaveApplication(leaveApplicationData: InsertLeaveApplication): Promise<LeaveApplication> {
    const id = this.leaveApplicationId++;
    const leaveApplication: LeaveApplication = { ...leaveApplicationData, id };
    this.leaveApplications.set(id, leaveApplication);
    return leaveApplication;
  }
  
  async updateLeaveApplication(id: number, leaveApplicationData: Partial<LeaveApplication>): Promise<LeaveApplication | undefined> {
    const leaveApplication = this.leaveApplications.get(id);
    if (!leaveApplication) return undefined;
    
    const updatedLeaveApplication = { ...leaveApplication, ...leaveApplicationData };
    this.leaveApplications.set(id, updatedLeaveApplication);
    return updatedLeaveApplication;
  }
  
  // Holiday operations
  async getHoliday(id: number): Promise<Holiday | undefined> {
    return this.holidays.get(id);
  }
  
  async getAllHolidays(): Promise<Holiday[]> {
    return Array.from(this.holidays.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async createHoliday(holidayData: InsertHoliday): Promise<Holiday> {
    const id = this.holidayId++;
    const holiday: Holiday = { ...holidayData, id };
    this.holidays.set(id, holiday);
    return holiday;
  }
  
  // Salary operations
  async getSalary(id: number): Promise<Salary | undefined> {
    return this.salaries.get(id);
  }
  
  async getSalariesByUserId(userId: number): Promise<Salary[]> {
    return Array.from(this.salaries.values())
      .filter(salary => salary.userId === userId)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }
  
  async createSalary(salaryData: InsertSalary): Promise<Salary> {
    const id = this.salaryId++;
    const salary: Salary = { ...salaryData, id };
    this.salaries.set(id, salary);
    return salary;
  }
  
  async updateSalary(id: number, salaryData: Partial<Salary>): Promise<Salary | undefined> {
    const salary = this.salaries.get(id);
    if (!salary) return undefined;
    
    const updatedSalary = { ...salary, ...salaryData };
    this.salaries.set(id, updatedSalary);
    return updatedSalary;
  }
}

export const storage = new MemStorage();
