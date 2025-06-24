import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import {
  insertAttendanceSchema,
  insertLeaveApplicationSchema,
  insertHolidaySchema,
  insertSalarySchema,
  userSchema,
  attendanceSchema,
  leaveApplicationSchema,
  leaveQuotaSchema,
  holidaySchema,
  salarySchema
} from "@shared/schema";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check role
const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = req.user as any;
    if (roles.includes(user.role)) {
      return next();
    }
    
    return res.status(403).json({ message: "Forbidden" });
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Test route for debugging connection issues
  app.get("/api/health", (req, res) => {
    console.log("Health check endpoint hit");
    res.status(200).json({ status: "OK", time: new Date().toISOString() });
  });
  
  // Setup authentication routes
  setupAuth(app);
  
  // API Routes
  
  // User management routes
  // Get all users (Admin and HR only)
  app.get("/api/users", isAuthenticated, hasRole(["admin", "hr"]), async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords before sending
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });
  
  // Get a single user by ID
  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.id;
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Only admin, HR, or the user themselves can access user data
      const currentUser = req.user as any;
      if (currentUser.role !== "admin" && currentUser.role !== "hr" && currentUser.id !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password before sending
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Error fetching user" });
    }
  });
  
  // Delete user (Admin can delete anyone, HR can only delete employees)
  app.delete("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      const userId = req.params.id;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Prevent users from deleting themselves
      if (currentUser.id === userId) {
        return res.status(400).json({ message: "Users cannot delete their own accounts" });
      }
      
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Permission checks
      if (currentUser.role === "admin") {
        // Admin can delete anyone
        const result = await storage.deleteUser(userId);
        if (result) {
          return res.json({ message: "User deleted successfully" });
        } else {
          return res.status(500).json({ message: "Failed to delete user" });
        }
      } else if (currentUser.role === "hr") {
        // HR can only delete employees
        if (userToDelete.role === "employee") {
          const result = await storage.deleteUser(userId);
          if (result) {
            return res.json({ message: "User deleted successfully" });
          } else {
            return res.status(500).json({ message: "Failed to delete user" });
          }
        } else {
          return res.status(403).json({ message: "HR can only delete employees" });
        }
      } else {
        return res.status(403).json({ message: "Forbidden" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user" });
    }
  });
  
  // Change user role (Admin only)
  app.patch("/api/users/:id/role", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const userId = req.params.id;
      const { role } = req.body;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Validate role
      if (!role || !["admin", "hr", "employee"].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'admin', 'hr', or 'employee'" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, { role });
      if (updatedUser) {
        // Remove password before sending
        const { password, ...userWithoutPassword } = updatedUser;
        return res.json(userWithoutPassword);
      } else {
        return res.status(500).json({ message: "Failed to update user role" });
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Error updating user role" });
    }
  });
  
  // Get attendance records for each user (admin/hr only)
  app.get("/api/users/attendance", isAuthenticated, hasRole(["admin", "hr"]), async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Create a mapping of user data with their attendance records
      const usersWithAttendance = await Promise.all(
        users.map(async (user) => {
          const { password, ...userWithoutPassword } = user;
          const attendances = await storage.getAttendancesByUserId(user.id);
          return {
            ...userWithoutPassword,
            attendances
          };
        })
      );
      
      res.json(usersWithAttendance);
    } catch (error) {
      console.error("Error fetching users with attendance:", error);
      res.status(500).json({ message: "Error fetching users with attendance" });
    }
  });
  

  
  // Attendance
  app.get("/api/attendance", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    // Parse query parameters
    const startDateParam = req.query.startDate as string;
    const endDateParam = req.query.endDate as string;
    
    let attendances;
    
    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      attendances = await storage.getAttendancesByDateRange(user.id, startDate, endDate);
    } else {
      attendances = await storage.getAttendancesByUserId(user.id);
    }
    
    res.json(attendances);
  });
  
  app.post("/api/attendance/clock-in", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Check if attendance record already exists for today
    const todayAttendances = await storage.getAttendancesByDate(today);
    const userTodayAttendance = todayAttendances.find(a => a.userId === user.id);
    
    if (userTodayAttendance) {
      if (userTodayAttendance.checkInTime) {
        return res.status(400).json({ message: "Already clocked in today" });
      }
      
      // Update existing record
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const checkInTime = `${hours}:${minutes}:00`;
      
      const updatedAttendance = await storage.updateAttendance(userTodayAttendance.id, {
        checkInTime,
        status: "present"
      });
      
      return res.json(updatedAttendance);
    }
    
    // Create new attendance record
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const checkInTime = `${hours}:${minutes}:00`;
    
    const newAttendance = await storage.createAttendance({
      userId: user.id,
      date: today,
      checkInTime,
      status: "present"
    });
    
    res.status(201).json(newAttendance);
  });
  
  app.post("/api/attendance/clock-out", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Find today's attendance record
    const todayAttendances = await storage.getAttendancesByDate(today);
    const userTodayAttendance = todayAttendances.find(a => a.userId === user.id);
    
    if (!userTodayAttendance) {
      return res.status(400).json({ message: "No clock-in record found for today" });
    }
    
    if (userTodayAttendance.checkOutTime) {
      return res.status(400).json({ message: "Already clocked out today" });
    }
    
    if (!userTodayAttendance.checkInTime) {
      return res.status(400).json({ message: "Must clock in before clocking out" });
    }
    
    // Update with check-out time
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const checkOutTime = `${hours}:${minutes}:00`;
    
    // Calculate working hours
    const checkInParts = userTodayAttendance.checkInTime.split(':');
    const checkInHours = parseInt(checkInParts[0]);
    const checkInMinutes = parseInt(checkInParts[1]);
    const checkInTotalMinutes = checkInHours * 60 + checkInMinutes;
    
    const checkOutHours = parseInt(hours);
    const checkOutMinutes = parseInt(minutes);
    const checkOutTotalMinutes = checkOutHours * 60 + checkOutMinutes;
    
    const minutesDiff = checkOutTotalMinutes - checkInTotalMinutes;
    const hoursWorked = Math.floor(minutesDiff / 60);
    const minutesWorked = minutesDiff % 60;
    
    const workingHours = `${hoursWorked}h ${minutesWorked}m`;
    
    const updatedAttendance = await storage.updateAttendance(userTodayAttendance.id, {
      checkOutTime,
      workingHours
    });
    
    res.json(updatedAttendance);
  });
  
  app.get("/api/attendance/all", hasRole(["admin", "hr"]), async (req, res) => {
    const dateParam = req.query.date as string;
    const userIdParam = req.query.userId as string;
    
    if (dateParam) {
      const date = new Date(dateParam);
      const attendances = await storage.getAttendancesByDate(date);
      
      if (userIdParam) {
        const userId = req.params.id;
        const filteredAttendances = attendances.filter(a => a.userId === userId);
        return res.json(filteredAttendances);
      }
      
      return res.json(attendances);
    }
    
    if (userIdParam) {
      const userId = req.params.id;
      const attendances = await storage.getAttendancesByUserId(userId);
      return res.json(attendances);
    }
    
    // If no params, return empty array (to avoid returning all attendances)
    res.json([]);
  });
  
  // Regularize attendance (for missed check-ins/outs)
  app.post("/api/attendance/regularize", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    const schema = insertAttendanceSchema.extend({
      date: z.string().transform(val => new Date(val)),
      checkInTime: z.string().optional(),
      checkOutTime: z.string().optional(),
      notes: z.string().min(1, "Reason for regularization is required")
    });
    
    try {
      const validatedData = schema.parse({
        ...req.body,
        userId: user.id,
        status: req.body.status || "present"
      });
      
      // Check if a record already exists for this date
      const dateAttendances = await storage.getAttendancesByDate(validatedData.date);
      const userDateAttendance = dateAttendances.find(a => a.userId === user.id);
      
      if (userDateAttendance) {
        // Update existing record
        const updatedAttendance = await storage.updateAttendance(userDateAttendance.id, validatedData);
        return res.json(updatedAttendance);
      }
      
      // Create new record
      const newAttendance = await storage.createAttendance(validatedData);
      res.status(201).json(newAttendance);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });
  
  // Leave Management
  
  // Get leave types
  app.get("/api/leave-types", isAuthenticated, async (req, res) => {
    const leaveTypes = await storage.getAllLeaveTypes();
    res.json(leaveTypes);
  });
  
  // Get leave quotas for current user
  app.get("/api/leave-quotas", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const leaveQuotas = await storage.getLeaveQuotasByUserId(user.id);
    
    // Get leave types to include their names
    const leaveTypes = await storage.getAllLeaveTypes();
    
    // Combine quota with leave type info
    const quotasWithTypes = await Promise.all(
      leaveQuotas.map(async (quota) => {
        const leaveType = leaveTypes.find(type => type.id === quota.leaveTypeId);
        return {
          ...quota,
          leaveType: leaveType || { name: "Unknown" }
        };
      })
    );
    
    res.json(quotasWithTypes);
  });
  
  // Apply for leave
  app.post("/api/leave-applications", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    
    const schema = insertLeaveApplicationSchema.extend({
      startDate: z.string().transform(val => new Date(val)),
      endDate: z.string().transform(val => new Date(val)),
      leaveTypeId: z.number().positive("Leave type is required"),
      totalDays: z.number().positive("Total days must be a positive number"),
      reason: z.string().min(1, "Reason is required")
    });
    
    try {
      const validatedData = schema.parse({
        ...req.body,
        userId: user.id,
        appliedAt: new Date(),
        status: "pending"
      });
      
      // Check leave quota
      const userLeaveQuotas = await storage.getLeaveQuotasByUserId(user.id);
      const leaveQuota = userLeaveQuotas.find(q => q.leaveTypeId === validatedData.leaveTypeId);
      
      if (!leaveQuota) {
        return res.status(400).json({ message: "Leave quota not found for this leave type" });
      }
      
      const remainingQuota = leaveQuota.totalQuota - leaveQuota.usedQuota;
      
      if (validatedData.totalDays > remainingQuota) {
        return res.status(400).json({ 
          message: `Insufficient leave balance. You have ${remainingQuota} days remaining.` 
        });
      }
      
      const leaveApplication = await storage.createLeaveApplication(validatedData);
      res.status(201).json(leaveApplication);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });
  
  // Get leave applications for current user
  app.get("/api/leave-applications", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const leaveApplications = await storage.getLeaveApplicationsByUserId(user.id);
    
    // Get leave types to include their names
    const leaveTypes = await storage.getAllLeaveTypes();
    
    // Combine applications with leave type info
    const applicationsWithTypes = await Promise.all(
      leaveApplications.map(async (application) => {
        const leaveType = leaveTypes.find(type => type.id === application.leaveTypeId);
        return {
          ...application,
          leaveType: leaveType || { name: "Unknown" }
        };
      })
    );
    
    res.json(applicationsWithTypes);
  });
  
  // Get all leave applications (admin/HR only)
  app.get("/api/leave-applications/all", hasRole(["admin", "hr"]), async (req, res) => {
    // Get all users
    const users = await storage.getAllUsers();
    
    // Get all leave applications
    const allApplications = [];
    
    for (const user of users) {
      const applications = await storage.getLeaveApplicationsByUserId(user.id);
      allApplications.push(...applications.map(app => ({
        ...app,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          department: user.department,
          position: user.position
        }
      })));
    }
    
    // Sort by applied date (most recent first)
    allApplications.sort((a, b) => 
      new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );
    
    // Get leave types to include their names
    const leaveTypes = await storage.getAllLeaveTypes();
    
    // Combine applications with leave type info
    const applicationsWithTypes = await Promise.all(
      allApplications.map(async (application) => {
        const leaveType = leaveTypes.find(type => type.id === application.leaveTypeId);
        return {
          ...application,
          leaveType: leaveType || { name: "Unknown" }
        };
      })
    );
    
    res.json(applicationsWithTypes);
  });
  
  // Approve/Reject leave application (admin/HR only)
  app.patch("/api/leave-applications/:id", hasRole(["admin", "hr"]), async (req, res) => {
    const id = req.params.id;
    const { status, comments } = req.body;
    
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }
    
    const leaveApplication = await storage.getLeaveApplication(id);
    
    if (!leaveApplication) {
      return res.status(404).json({ message: "Leave application not found" });
    }
    
    if (leaveApplication.status !== "pending") {
      return res.status(400).json({ message: "Cannot update a non-pending application" });
    }
    
    const admin = req.user as any;
    
    const updatedApplication = await storage.updateLeaveApplication(id, {
      status,
      comments,
      approvedBy: admin.id,
      approvedAt: new Date()
    });
    
    // If approved, update the leave quota
    if (status === "approved") {
      const userLeaveQuotas = await storage.getLeaveQuotasByUserId(leaveApplication.userId);
      const leaveQuota = userLeaveQuotas.find(q => q.leaveTypeId === leaveApplication.leaveTypeId);
      
      if (leaveQuota) {
        await storage.updateLeaveQuota(leaveQuota.id, {
          usedQuota: leaveQuota.usedQuota + leaveApplication.totalDays
        });
      }
    }
    
    res.json(updatedApplication);
  });
  
  // Holidays
  app.get("/api/holidays", isAuthenticated, async (req, res) => {
    const holidays = await storage.getAllHolidays();
    res.json(holidays);
  });
  
  // Admin can add holidays
  app.post("/api/holidays", hasRole(["admin"]), async (req, res) => {
    const schema = insertHolidaySchema.extend({
      date: z.string().transform(val => new Date(val)),
    });
    
    try {
      const validatedData = schema.parse(req.body);
      const holiday = await storage.createHoliday(validatedData);
      res.status(201).json(holiday);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });
  
  // Payroll
  app.get("/api/salary", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const salaries = await storage.getSalariesByUserId(user.id);
    res.json(salaries);
  });
  
  // Admin/HR can generate salary
  app.post("/api/salary", hasRole(["admin", "hr"]), async (req, res) => {
    const schema = insertSalarySchema;
    
    try {
      const validatedData = schema.parse(req.body);
      
      // Check if salary already exists for user, month, and year
      const existingSalaries = await storage.getSalariesByUserId(validatedData.userId);
      const exists = existingSalaries.some(
        s => s.month === validatedData.month && s.year === validatedData.year
      );
      
      if (exists) {
        return res.status(400).json({ 
          message: "Salary already generated for this user and month" 
        });
      }
      
      const salary = await storage.createSalary(validatedData);
      res.status(201).json(salary);
    } catch (error) {
      res.status(400).json({ message: "Invalid data", error });
    }
  });
  
  // Admin/HR can update salary status
  app.patch("/api/salary/:id", hasRole(["admin", "hr"]), async (req, res) => {
    const id = req.params.id;
    const { paymentStatus, paymentDate, notes } = req.body;
    
    if (!["pending", "paid"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Status must be 'pending' or 'paid'" });
    }
    
    const salary = await storage.getSalary(id);
    
    if (!salary) {
      return res.status(404).json({ message: "Salary record not found" });
    }
    
    const updatedSalary = await storage.updateSalary(id, {
      paymentStatus,
      paymentDate: paymentDate ? new Date(paymentDate) : undefined,
      notes
    });
    
    res.json(updatedSalary);
  });
  
  // Reports
  
  // Attendance summary report
  app.get("/api/reports/attendance", hasRole(["admin", "hr"]), async (req, res) => {
    const startDateParam = req.query.startDate as string;
    const endDateParam = req.query.endDate as string;
    const userIdParam = req.query.userId as string;
    
    if (!startDateParam || !endDateParam) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }
    
    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);
    
    // Get all users or specific user
    let users;
    if (userIdParam) {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      if (user) {
        users = [user];
      } else {
        return res.status(404).json({ message: "User not found" });
      }
    } else {
      users = await storage.getAllUsers();
    }
    
    // Get attendance data for each user
    const report = await Promise.all(
      users.map(async (user) => {
        const attendances = await storage.getAttendancesByDateRange(user.id, startDate, endDate);
        
        const presentDays = attendances.filter(a => a.status === "present").length;
        const absentDays = attendances.filter(a => a.status === "absent").length;
        const halfDays = attendances.filter(a => a.status === "half-day").length;
        
        // Calculate working hours
        let totalWorkingMinutes = 0;
        let lateArrivals = 0;
        
        attendances.forEach(attendance => {
          if (attendance.workingHours) {
            const match = attendance.workingHours.match(/(\d+)h\s+(\d+)m/);
            if (match) {
              const hours = parseInt(match[1]);
              const minutes = parseInt(match[2]);
              totalWorkingMinutes += hours * 60 + minutes;
            }
          }
          
          // Check for late arrivals (after 9:30 AM)
          if (attendance.checkInTime) {
            const checkInParts = attendance.checkInTime.split(':');
            const checkInHours = parseInt(checkInParts[0]);
            const checkInMinutes = parseInt(checkInParts[1]);
            
            if (checkInHours > 9 || (checkInHours === 9 && checkInMinutes > 30)) {
              lateArrivals++;
            }
          }
        });
        
        const avgWorkingHoursPerDay = Math.floor((totalWorkingMinutes / Math.max(1, presentDays)) / 60);
        const avgWorkingMinutesPerDay = Math.floor((totalWorkingMinutes / Math.max(1, presentDays)) % 60);
        
        const { password, ...userWithoutPassword } = user;
        
        return {
          user: userWithoutPassword,
          presentDays,
          absentDays,
          halfDays,
          lateArrivals,
          avgWorkingHours: `${avgWorkingHoursPerDay}h ${avgWorkingMinutesPerDay}m`
        };
      })
    );
    
    res.json(report);
  });
  
  // Leave utilization report
  app.get("/api/reports/leave-utilization", hasRole(["admin", "hr"]), async (req, res) => {
    const yearParam = req.query.year as string;
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
    
    // Get all users
    const users = await storage.getAllUsers();
    
    // Get leave types
    const leaveTypes = await storage.getAllLeaveTypes();
    
    // Generate report
    const report = await Promise.all(
      users.map(async (user) => {
        const leaveQuotas = await storage.getLeaveQuotasByUserId(user.id);
        
        const leaveUtilization = await Promise.all(
          leaveTypes.map(async (leaveType) => {
            const quota = leaveQuotas.find(q => q.leaveTypeId === leaveType.id && q.year === year);
            
            return {
              leaveType: leaveType.name,
              totalQuota: quota ? quota.totalQuota : 0,
              usedQuota: quota ? quota.usedQuota : 0,
              remainingQuota: quota ? quota.totalQuota - quota.usedQuota : 0,
              utilizationPercentage: quota ? 
                Math.round((quota.usedQuota / quota.totalQuota) * 100) : 0
            };
          })
        );
        
        const { password, ...userWithoutPassword } = user;
        
        return {
          user: userWithoutPassword,
          leaveUtilization
        };
      })
    );
    
    res.json(report);
  });
  
  // Payroll report
  app.get("/api/reports/payroll", hasRole(["admin", "hr"]), async (req, res) => {
    const monthParam = req.query.month as string;
    const yearParam = req.query.year as string;
    
    if (!monthParam || !yearParam) {
      return res.status(400).json({ message: "Month and year are required" });
    }
    
    const month = parseInt(monthParam);
    const year = parseInt(yearParam);
    
    // Get all users
    const users = await storage.getAllUsers();
    
    // Get salary data for each user
    const report = await Promise.all(
      users.map(async (user) => {
        const salaries = await storage.getSalariesByUserId(user.id);
        const salary = salaries.find(s => s.month === month && s.year === year);
        
        const { password, ...userWithoutPassword } = user;
        
        return {
          user: userWithoutPassword,
          salary: salary || null
        };
      })
    );
    
    const totalSalaries = report.reduce((sum, item) => 
      sum + (item.salary ? item.salary.netSalary : 0), 0);
    
    res.json({
      month,
      year,
      employees: report,
      totalSalaries,
      paidCount: report.filter(r => r.salary && r.salary.paymentStatus === "paid").length,
      pendingCount: report.filter(r => r.salary && r.salary.paymentStatus === "pending").length,
      noSalaryCount: report.filter(r => !r.salary).length
    });
  });

  // User routes
  app.post('/api/register', async (req, res) => {
    try {
      const userData = userSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
      }
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  });

  // Attendance routes
  app.get('/api/attendances', async (req, res) => {
    try {
      const attendances = await storage.getAttendances();
      res.json(attendances);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  });

  app.post('/api/attendances', async (req, res) => {
    try {
      const attendanceData = attendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
      }
    }
  });

  // Leave application routes
  app.get('/api/leave-applications', async (req, res) => {
    try {
      const applications = await storage.getLeaveApplications();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  });

  app.post('/api/leave-applications', async (req, res) => {
    try {
      const applicationData = leaveApplicationSchema.parse(req.body);
      const application = await storage.createLeaveApplication(applicationData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
      }
    }
  });

  // Leave quota routes
  app.get('/api/leave-quotas', async (req, res) => {
    try {
      const quotas = await storage.getLeaveQuotas();
      res.json(quotas);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  });

  app.post('/api/leave-quotas', async (req, res) => {
    try {
      const quotaData = leaveQuotaSchema.parse(req.body);
      const quota = await storage.createLeaveQuota(quotaData);
      res.status(201).json(quota);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
      }
    }
  });

  // Holiday routes
  app.get('/api/holidays', async (req, res) => {
    try {
      const holidays = await storage.getHolidays();
      res.json(holidays);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  });

  app.post('/api/holidays', async (req, res) => {
    try {
      const holidayData = holidaySchema.parse(req.body);
      const holiday = await storage.createHoliday(holidayData);
      res.status(201).json(holiday);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
      }
    }
  });

  // Salary routes
  app.get('/api/salaries', async (req, res) => {
    try {
      const salaries = await storage.getSalaries();
      res.json(salaries);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  });

  app.post('/api/salaries', async (req, res) => {
    try {
      const salaryData = salarySchema.parse(req.body);
      const salary = await storage.createSalary(salaryData);
      res.status(201).json(salary);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Validation error', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Server error', error: (error as Error).message });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
