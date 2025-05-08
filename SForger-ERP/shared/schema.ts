import { pgTable, text, serial, integer, boolean, date, time, timestamp, foreignKey, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("employee"),
  department: text("department"),
  position: text("position"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  role: true,
  department: true,
  position: true,
  profileImage: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Attendance model
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  timeIn: time("time_in"),
  timeOut: time("time_out"),
  status: text("status").notNull(), // present, absent, half-day, etc.
  notes: text("notes"),
});

export const insertAttendanceSchema = createInsertSchema(attendance).pick({
  userId: true,
  date: true,
  timeIn: true,
  timeOut: true,
  status: true,
  notes: true,
});

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

// Leave types: PL (Paid Leave), SL (Sick Leave), CL (Casual Leave)
export const leaveTypes = pgTable("leave_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  defaultDays: integer("default_days").notNull().default(0),
  color: text("color"),
});

export const insertLeaveTypeSchema = createInsertSchema(leaveTypes).pick({
  name: true,
  description: true,
  defaultDays: true,
  color: true,
});

export type InsertLeaveType = z.infer<typeof insertLeaveTypeSchema>;
export type LeaveType = typeof leaveTypes.$inferSelect;

// Leave balances
export const leaveBalances = pgTable("leave_balances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  leaveTypeId: integer("leave_type_id").notNull().references(() => leaveTypes.id),
  year: integer("year").notNull(),
  totalDays: integer("total_days").notNull(),
  usedDays: integer("used_days").notNull().default(0),
});

export const insertLeaveBalanceSchema = createInsertSchema(leaveBalances).pick({
  userId: true,
  leaveTypeId: true,
  year: true,
  totalDays: true,
  usedDays: true,
});

export type InsertLeaveBalance = z.infer<typeof insertLeaveBalanceSchema>;
export type LeaveBalance = typeof leaveBalances.$inferSelect;

// Leave applications
export const leaveApplications = pgTable("leave_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  leaveTypeId: integer("leave_type_id").notNull().references(() => leaveTypes.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: integer("approved_by").references(() => users.id),
  appliedAt: timestamp("applied_at").defaultNow(),
  actionDate: timestamp("action_date"),
  comments: text("comments"),
});

export const insertLeaveApplicationSchema = createInsertSchema(leaveApplications).pick({
  userId: true,
  leaveTypeId: true,
  startDate: true,
  endDate: true,
  reason: true,
  status: true,
  approvedBy: true,
  comments: true,
});

export type InsertLeaveApplication = z.infer<typeof insertLeaveApplicationSchema>;
export type LeaveApplication = typeof leaveApplications.$inferSelect;

// Payroll
export const payroll = pgTable("payroll", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  baseSalary: integer("base_salary").notNull(),
  allowances: integer("allowances").default(0),
  deductions: integer("deductions").default(0),
  netSalary: integer("net_salary").notNull(),
  payDate: date("pay_date").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid
  details: json("details"),
});

export const insertPayrollSchema = createInsertSchema(payroll).pick({
  userId: true,
  month: true,
  year: true,
  baseSalary: true,
  allowances: true,
  deductions: true,
  netSalary: true,
  payDate: true,
  paymentStatus: true,
  details: true,
});

export type InsertPayroll = z.infer<typeof insertPayrollSchema>;
export type Payroll = typeof payroll.$inferSelect;

// Company settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
  description: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

// Activities for the activity log
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  description: text("description"),
  timestamp: timestamp("timestamp").defaultNow(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  action: true,
  description: true,
  entityType: true,
  entityId: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// Announcements for the dashboard
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  priority: text("priority").default("normal"), // low, normal, high
});

export const insertAnnouncementSchema = createInsertSchema(announcements).pick({
  title: true,
  content: true,
  createdBy: true,
  expiresAt: true,
  priority: true,
});

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

// Holidays
export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: date("date").notNull(),
  description: text("description"),
  isRecurring: boolean("is_recurring").default(false),
});

export const insertHolidaySchema = createInsertSchema(holidays).pick({
  name: true,
  date: true,
  description: true,
  isRecurring: true,
});

export type InsertHoliday = z.infer<typeof insertHolidaySchema>;
export type Holiday = typeof holidays.$inferSelect;
