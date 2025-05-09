import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { hashPassword } from "./auth";
import { z } from "zod";
import { 
  insertAttendanceSchema, 
  insertLeaveApplicationSchema, 
  insertLeaveTypeSchema,
  insertHolidaySchema,
  insertSettingSchema,
  insertUserSchema
} from "@shared/schema";

// Middleware to check if the user is authenticated
const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if the user has a specific role
const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    
    next();
  };
};

// Admin and HR users can access these routes
const isAdminOrHR = checkRole(["admin", "hr"]);

// Only admin users can access these routes
const isAdmin = checkRole(["admin"]);

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // User related routes
  app.get("/api/users", isAdminOrHR, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", ensureAuthenticated, async (req, res) => {
    try {
      // Users can access their own info, admins/HR can access anyone's
      if (
        req.user?.role !== "admin" && 
        req.user?.role !== "hr" && 
        req.user?.id !== parseInt(req.params.id)
      ) {
        return res.status(403).json({ message: "Forbidden: Cannot access other user's data" });
      }
      
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", isAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const hashedPassword = await hashPassword(userData.password);
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Initialize user's leave balances
      await storage.initializeUserLeaveBalances(newUser.id);
      
      // Log this activity
      await storage.createActivity({
        userId: req.user!.id,
        action: "CREATE_USER",
        description: `Created user: ${newUser.username}`,
        entityType: "user",
        entityId: newUser.id
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", isAdminOrHR, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const existingUser = await storage.getUser(userId);
      
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // HR users can only update certain fields, while admins can update everything
      if (req.user?.role === "hr") {
        const allowedFields = ["fullName", "email", "department", "position", "profileImage"];
        const forbiddenFields = Object.keys(req.body).filter(field => !allowedFields.includes(field));
        
        if (forbiddenFields.length > 0) {
          return res.status(403).json({ 
            message: "Forbidden: HR cannot update these fields", 
            fields: forbiddenFields 
          });
        }
      }
      
      // Hash password if it's being updated
      if (req.body.password) {
        req.body.password = await hashPassword(req.body.password);
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      
      // Log this activity
      await storage.createActivity({
        userId: req.user!.id,
        action: "UPDATE_USER",
        description: `Updated user: ${updatedUser.username}`,
        entityType: "user",
        entityId: updatedUser.id
      });
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Attendance related routes
  app.post("/api/attendance/clock-in", ensureAuthenticated, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const userId = req.user!.id;
      
      // Check if there's already an attendance record for today
      const existingRecord = await storage.getAttendanceByUserAndDate(userId, today);
      
      if (existingRecord && existingRecord.timeIn) {
        return res.status(400).json({ message: "Already clocked in today" });
      }
      
      const now = new Date();
      const timeIn = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
      
      let attendanceRecord;
      if (existingRecord) {
        // Update existing record
        attendanceRecord = await storage.updateAttendance(existingRecord.id, {
          timeIn,
          status: "present"
        });
      } else {
        // Create new record
        attendanceRecord = await storage.createAttendance({
          userId,
          date: today,
          timeIn,
          status: "present"
        });
      }
      
      // Log this activity
      await storage.createActivity({
        userId,
        action: "CLOCK_IN",
        description: `Clocked in at ${timeIn}`,
        entityType: "attendance",
        entityId: attendanceRecord.id
      });
      
      res.status(201).json(attendanceRecord);
    } catch (error) {
      res.status(500).json({ message: "Failed to clock in" });
    }
  });

  app.post("/api/attendance/clock-out", ensureAuthenticated, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const userId = req.user!.id;
      
      // Check if there's already an attendance record for today
      const existingRecord = await storage.getAttendanceByUserAndDate(userId, today);
      
      if (!existingRecord || !existingRecord.timeIn) {
        return res.status(400).json({ message: "Must clock in before clocking out" });
      }
      
      if (existingRecord.timeOut) {
        return res.status(400).json({ message: "Already clocked out today" });
      }
      
      const now = new Date();
      const timeOut = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
      
      const attendanceRecord = await storage.updateAttendance(existingRecord.id, { timeOut });
      
      // Log this activity
      await storage.createActivity({
        userId,
        action: "CLOCK_OUT",
        description: `Clocked out at ${timeOut}`,
        entityType: "attendance",
        entityId: attendanceRecord.id
      });
      
      res.json(attendanceRecord);
    } catch (error) {
      res.status(500).json({ message: "Failed to clock out" });
    }
  });

  app.get("/api/attendance", ensureAuthenticated, async (req, res) => {
    try {
      let userId = req.query.userId ? parseInt(req.query.userId as string) : req.user!.id;
      
      // Non-admin/HR users can only view their own attendance
      if (req.user?.role !== "admin" && req.user?.role !== "hr" && userId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: Cannot access other user's attendance" });
      }
      
      const startDate = req.query.startDate as string || undefined;
      const endDate = req.query.endDate as string || undefined;
      
      const attendance = await storage.getAttendanceByUser(userId, startDate, endDate);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  // Leave related routes
  app.get("/api/leave-types", ensureAuthenticated, async (req, res) => {
    try {
      const leaveTypes = await storage.getAllLeaveTypes();
      res.json(leaveTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leave types" });
    }
  });

  app.post("/api/leave-types", isAdmin, async (req, res) => {
    try {
      const leaveTypeData = insertLeaveTypeSchema.parse(req.body);
      const newLeaveType = await storage.createLeaveType(leaveTypeData);
      
      // Log this activity
      await storage.createActivity({
        userId: req.user!.id,
        action: "CREATE_LEAVE_TYPE",
        description: `Created leave type: ${newLeaveType.name}`,
        entityType: "leave_type",
        entityId: newLeaveType.id
      });
      
      res.status(201).json(newLeaveType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid leave type data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create leave type" });
    }
  });

  app.get("/api/leave-balances", ensureAuthenticated, async (req, res) => {
    try {
      let userId = req.query.userId ? parseInt(req.query.userId as string) : req.user!.id;
      
      // Non-admin/HR users can only view their own leave balances
      if (req.user?.role !== "admin" && req.user?.role !== "hr" && userId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: Cannot access other user's leave balances" });
      }
      
      const leaveBalances = await storage.getLeaveBalancesByUser(userId);
      res.json(leaveBalances);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leave balances" });
    }
  });

  app.post("/api/leave-applications", ensureAuthenticated, async (req, res) => {
    try {
      // Users can only apply for their own leave
      if (req.body.userId && req.body.userId !== req.user!.id && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Cannot apply leave for other users" });
      }
      
      const leaveData = {
        ...req.body,
        userId: req.body.userId || req.user!.id
      };
      
      const leaveApplication = insertLeaveApplicationSchema.parse(leaveData);
      
      // Check if the user has enough leave balance
      const leaveType = await storage.getLeaveType(leaveApplication.leaveTypeId);
      if (!leaveType) {
        return res.status(404).json({ message: "Leave type not found" });
      }
      
      const leaveBalance = await storage.getLeaveBalanceByUserAndType(
        leaveApplication.userId, 
        leaveApplication.leaveTypeId
      );
      
      if (!leaveBalance) {
        return res.status(404).json({ message: "Leave balance not found for this user" });
      }
      
      // Calculate the number of days
      const startDate = new Date(leaveApplication.startDate);
      const endDate = new Date(leaveApplication.endDate);
      const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
      
      if (dayDiff > (leaveBalance.totalDays - leaveBalance.usedDays)) {
        return res.status(400).json({ 
          message: "Insufficient leave balance", 
          requested: dayDiff,
          available: leaveBalance.totalDays - leaveBalance.usedDays
        });
      }
      
      const newLeaveApplication = await storage.createLeaveApplication(leaveApplication);
      
      // Log this activity
      await storage.createActivity({
        userId: req.user!.id,
        action: "APPLY_LEAVE",
        description: `Applied for ${leaveType.name} from ${leaveApplication.startDate} to ${leaveApplication.endDate}`,
        entityType: "leave_application",
        entityId: newLeaveApplication.id
      });
      
      res.status(201).json(newLeaveApplication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid leave application data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create leave application" });
    }
  });

  app.get("/api/leave-applications", ensureAuthenticated, async (req, res) => {
    try {
      let userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      let status = req.query.status as string || undefined;
      
      // Non-admin/HR users can only view their own leave applications
      if (req.user?.role !== "admin" && req.user?.role !== "hr") {
        userId = req.user!.id;
      }
      
      const leaveApplications = await storage.getLeaveApplications(userId, status);
      res.json(leaveApplications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leave applications" });
    }
  });

  app.patch("/api/leave-applications/:id", isAdminOrHR, async (req, res) => {
    try {
      const leaveId = parseInt(req.params.id);
      const { status, comments } = req.body;
      
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be either 'approved' or 'rejected'" });
      }
      
      const leaveApplication = await storage.getLeaveApplication(leaveId);
      if (!leaveApplication) {
        return res.status(404).json({ message: "Leave application not found" });
      }
      
      // Update the leave application
      const updatedLeave = await storage.updateLeaveApplication(leaveId, {
        status,
        approvedBy: req.user!.id,
        actionDate: new Date().toISOString(),
        comments: comments || null
      });
      
      // If approved, update the leave balance
      if (status === "approved") {
        const startDate = new Date(leaveApplication.startDate);
        const endDate = new Date(leaveApplication.endDate);
        const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
        
        await storage.incrementUsedLeaveBalance(
          leaveApplication.userId, 
          leaveApplication.leaveTypeId, 
          dayDiff
        );
      }
      
      // Log this activity
      await storage.createActivity({
        userId: req.user!.id,
        action: status === "approved" ? "APPROVE_LEAVE" : "REJECT_LEAVE",
        description: `${status === "approved" ? "Approved" : "Rejected"} leave application for user ${leaveApplication.userId}`,
        entityType: "leave_application",
        entityId: leaveId
      });
      
      res.json(updatedLeave);
    } catch (error) {
      res.status(500).json({ message: "Failed to update leave application" });
    }
  });

  // Payroll related routes
  app.get("/api/payroll", ensureAuthenticated, async (req, res) => {
    try {
      let userId = req.query.userId ? parseInt(req.query.userId as string) : req.user!.id;
      
      // Non-admin/HR users can only view their own payroll
      if (req.user?.role !== "admin" && req.user?.role !== "hr" && userId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: Cannot access other user's payroll" });
      }
      
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      
      const payrollRecords = await storage.getPayrollByUser(userId, month, year);
      res.json(payrollRecords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payroll records" });
    }
  });

  // Settings related routes
  app.get("/api/settings", isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", isAdmin, async (req, res) => {
    try {
      const settingData = insertSettingSchema.parse(req.body);
      const existingSetting = await storage.getSettingByKey(settingData.key);
      
      if (existingSetting) {
        const updatedSetting = await storage.updateSetting(existingSetting.id, settingData);
        return res.json(updatedSetting);
      }
      
      const newSetting = await storage.createSetting(settingData);
      
      // Log this activity
      await storage.createActivity({
        userId: req.user!.id,
        action: "CREATE_SETTING",
        description: `Created/updated setting: ${newSetting.key}`,
        entityType: "setting",
        entityId: newSetting.id
      });
      
      res.status(201).json(newSetting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid setting data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save setting" });
    }
  });

  // Holidays related routes
  app.get("/api/holidays", ensureAuthenticated, async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const holidays = await storage.getHolidaysByYear(year);
      res.json(holidays);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch holidays" });
    }
  });

  app.post("/api/holidays", isAdmin, async (req, res) => {
    try {
      const holidayData = insertHolidaySchema.parse(req.body);
      const newHoliday = await storage.createHoliday(holidayData);
      
      // Log this activity
      await storage.createActivity({
        userId: req.user!.id,
        action: "CREATE_HOLIDAY",
        description: `Created holiday: ${newHoliday.name} on ${newHoliday.date}`,
        entityType: "holiday",
        entityId: newHoliday.id
      });
      
      res.status(201).json(newHoliday);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid holiday data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create holiday" });
    }
  });

  // Activities (for dashboard, recent activities)
  app.get("/api/activities", ensureAuthenticated, async (req, res) => {
    try {
      let userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      // Non-admin/HR users can only view their own activities
      if (req.user?.role !== "admin" && req.user?.role !== "hr") {
        userId = req.user!.id;
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Announcements
  app.get("/api/announcements", ensureAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const announcements = await storage.getAnnouncements(limit);
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // Reports endpoints
  // Attendance report
  app.get("/api/reports/attendance", isAdminOrHR, async (req, res) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const department = req.query.department as string || undefined;
      
      const report = await storage.getAttendanceReport(startDate, endDate, department);
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate attendance report" });
    }
  });

  // Leave report
  app.get("/api/reports/leave", isAdminOrHR, async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
      const department = req.query.department as string || undefined;
      
      const report = await storage.getLeaveReport(year, department);
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate leave report" });
    }
  });

  // Initialize default data if none exists
  initializeDefaultData();
  
  const httpServer = createServer(app);
  return httpServer;
}

// Initialize default data (leave types, admin user, etc.)
async function initializeDefaultData() {
  // Check if any users exist
  const users = await storage.getAllUsers();
  if (users.length === 0) {
    // Create admin user
    const adminPassword = await hashPassword("admin123");
    await storage.createUser({
      username: "admin",
      password: adminPassword,
      fullName: "Admin User",
      email: "admin@sforger.com",
      role: "admin",
      department: "Administration",
      position: "System Administrator"
    });
    
    // Create HR user
    const hrPassword = await hashPassword("hr123");
    await storage.createUser({
      username: "hr",
      password: hrPassword,
      fullName: "HR Manager",
      email: "hr@sforger.com",
      role: "hr",
      department: "Human Resources",
      position: "HR Manager"
    });
    
    // Create employee user
    const empPassword = await hashPassword("emp123");
    await storage.createUser({
      username: "employee",
      password: empPassword,
      fullName: "John Employee",
      email: "john@sforger.com",
      role: "employee",
      department: "Engineering",
      position: "Software Developer"
    });
  }
  
  // Check if any leave types exist
  const leaveTypes = await storage.getAllLeaveTypes();
  if (leaveTypes.length === 0) {
    // Create default leave types
    await storage.createLeaveType({
      name: "Paid Leave",
      description: "Annual paid leave",
      defaultDays: 15,
      color: "#3b82f6"
    });
    
    await storage.createLeaveType({
      name: "Sick Leave",
      description: "Leave for medical reasons",
      defaultDays: 10,
      color: "#ef4444"
    });
    
    await storage.createLeaveType({
      name: "Casual Leave",
      description: "Short-term leave for personal matters",
      defaultDays: 5,
      color: "#f59e0b"
    });
  }
  
  // Create default settings
  const workingHoursSettings = await storage.getSettingByKey("working_hours");
  if (!workingHoursSettings) {
    await storage.createSetting({
      key: "working_hours",
      value: "9",
      description: "Standard working hours per day"
    });
  }
  
  // Initialize leave balances for all users
  const allUsers = await storage.getAllUsers();
  const allLeaveTypes = await storage.getAllLeaveTypes();
  
  for (const user of allUsers) {
    // Check if this user already has leave balances
    const existingBalances = await storage.getLeaveBalancesByUser(user.id);
    if (existingBalances.length === 0) {
      await storage.initializeUserLeaveBalances(user.id);
    }
  }
}
