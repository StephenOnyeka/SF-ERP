import { pgTable, text, serial, integer, boolean, timestamp, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("employee"), // admin, hr, employee
  department: text("department"),
  position: text("position"),
  joinDate: date("join_date").notNull().default(new Date()),
  profileImage: text("profile_image"),
  companyId: text("company_id").notNull().unique(), // Format: SF-001, SF-002, etc.
});

// Attendance records
export const attendances = pgTable("attendances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull().default(new Date()),
  checkInTime: time("check_in_time"),
  checkOutTime: time("check_out_time"),
  status: text("status").notNull().default("present"), // present, absent, half-day
  workingHours: text("working_hours"),
  notes: text("notes"),
});

// Leave types
export const leaveTypes = pgTable("leave_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  colorCode: text("color_code"),
});

// Leave quotas for each employee
export const leaveQuotas = pgTable("leave_quotas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  leaveTypeId: integer("leave_type_id").notNull(),
  totalQuota: integer("total_quota").notNull(),
  usedQuota: integer("used_quota").notNull().default(0),
  year: integer("year").notNull(),
});

// Leave applications
export const leaveApplications = pgTable("leave_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  leaveTypeId: integer("leave_type_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isFirstDayHalf: boolean("is_first_day_half").notNull().default(false),
  isLastDayHalf: boolean("is_last_day_half").notNull().default(false),
  totalDays: integer("total_days").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  appliedAt: timestamp("applied_at").notNull().default(new Date()),
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
  comments: text("comments"),
});

// Holidays
export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: date("date").notNull(),
  description: text("description"),
  type: text("type").notNull().default("national"), // national, company, etc.
});

// Salary records
export const salaries = pgTable("salaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  baseSalary: integer("base_salary").notNull(),
  deductions: integer("deductions").default(0),
  bonus: integer("bonus").default(0),
  netSalary: integer("net_salary").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid
  paymentDate: date("payment_date"),
  notes: text("notes"),
});

// Insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  department: true,
  position: true,
  joinDate: true,
  profileImage: true,
  companyId: true,
});

export const insertAttendanceSchema = createInsertSchema(attendances).pick({
  userId: true,
  date: true,
  checkInTime: true,
  checkOutTime: true,
  status: true,
  workingHours: true,
  notes: true,
});

export const insertLeaveTypeSchema = createInsertSchema(leaveTypes).pick({
  name: true,
  description: true,
  colorCode: true,
});

export const insertLeaveQuotaSchema = createInsertSchema(leaveQuotas).pick({
  userId: true,
  leaveTypeId: true,
  totalQuota: true,
  usedQuota: true,
  year: true,
});

export const insertLeaveApplicationSchema = createInsertSchema(leaveApplications).pick({
  userId: true,
  leaveTypeId: true,
  startDate: true,
  endDate: true,
  isFirstDayHalf: true,
  isLastDayHalf: true,
  totalDays: true,
  reason: true,
  status: true,
  appliedAt: true,
  approvedBy: true,
  approvedAt: true,
  comments: true,
});

export const insertHolidaySchema = createInsertSchema(holidays).pick({
  name: true,
  date: true,
  description: true,
  type: true,
});

export const insertSalarySchema = createInsertSchema(salaries).pick({
  userId: true,
  month: true,
  year: true,
  baseSalary: true,
  deductions: true,
  bonus: true,
  netSalary: true,
  paymentStatus: true,
  paymentDate: true,
  notes: true,
});

// Types for insert operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertLeaveType = z.infer<typeof insertLeaveTypeSchema>;
export type InsertLeaveQuota = z.infer<typeof insertLeaveQuotaSchema>;
export type InsertLeaveApplication = z.infer<typeof insertLeaveApplicationSchema>;
export type InsertHoliday = z.infer<typeof insertHolidaySchema>;
export type InsertSalary = z.infer<typeof insertSalarySchema>;

// Types for select operations
export type User = typeof users.$inferSelect;
export type Attendance = typeof attendances.$inferSelect;
export type LeaveType = typeof leaveTypes.$inferSelect;
export type LeaveQuota = typeof leaveQuotas.$inferSelect;
export type LeaveApplication = typeof leaveApplications.$inferSelect;
export type Holiday = typeof holidays.$inferSelect;
export type Salary = typeof salaries.$inferSelect;

// Extended schemas for auth
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginData = z.infer<typeof loginSchema>;
