import { z } from "zod";

// Base schemas
export const userSchema = z.object({
  id: z.string(),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "hr", "employee"]).default("employee"),
  department: z.string().optional(),
  position: z.string().optional(),
  joinDate: z.date().default(() => new Date()),
  profileImage: z.string().optional(),
  companyId: z.string().regex(/^SF-\d{3}$/, "Invalid company ID format"),
});

export const attendanceSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  date: z.date().default(() => new Date()),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  status: z.enum(["present", "leave", "absent", "half-day"]).default("present"),
  workingHours: z.string().optional(),
  notes: z.string().optional(),
});

export const leaveTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  colorCode: z.string().optional(),
});

export const leaveQuotaSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  leaveTypeId: z.number(),
  totalQuota: z.number().min(0),
  usedQuota: z.number().min(0).default(0),
  year: z.number(),
});

export const leaveApplicationSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  leaveTypeId: z.number(),
  startDate: z.date(),
  endDate: z.date(),
  isFirstDayHalf: z.boolean().default(false),
  isLastDayHalf: z.boolean().default(false),
  totalDays: z.number().min(0),
  reason: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  appliedAt: z.date().default(() => new Date()),
  approvedBy: z.number().optional(),
  approvedAt: z.date().optional(),
  comments: z.string().optional(),
});

export const holidaySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  date: z.date(),
  description: z.string().optional(),
  type: z.enum(["national", "company"]).default("national"),
});

export const salarySchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number(),
  baseSalary: z.number().min(0),
  deductions: z.number().min(0).default(0),
  bonus: z.number().min(0).default(0),
  netSalary: z.number().min(0),
  paymentStatus: z.enum(["pending", "paid"]).default("pending"),
  paymentDate: z.date().optional(),
  notes: z.string().optional(),
});

// Types for all schemas
export type User = z.infer<typeof userSchema>;
export type Attendance = z.infer<typeof attendanceSchema>;
export type LeaveType = z.infer<typeof leaveTypeSchema>;
export type LeaveQuota = z.infer<typeof leaveQuotaSchema>;
export type LeaveApplication = z.infer<typeof leaveApplicationSchema>;
export type Holiday = z.infer<typeof holidaySchema>;
export type Salary = z.infer<typeof salarySchema>;

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginData = z.infer<typeof loginSchema>;

// Insert schemas (for creating new records)
export const insertAttendanceSchema = attendanceSchema.omit({ id: true });
export const insertLeaveApplicationSchema = leaveApplicationSchema.omit({ id: true });
export const insertHolidaySchema = holidaySchema.omit({ id: true });
export const insertSalarySchema = salarySchema.omit({ id: true });