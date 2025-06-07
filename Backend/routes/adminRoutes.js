const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const LeaveRequest = require("../models/LeaveRequest");
const { auth, isAdmin } = require("../middleware/auth");
const { z } = require("zod");

// Validation schemas
const userUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["admin", "hr", "employee"]).optional(),
  isActive: z.boolean().optional(),
});

const holidaySchema = z.object({
  name: z.string().min(2),
  date: z.string().transform((str) => new Date(str)),
  description: z.string().optional(),
});

// Get all users (Admin only)
router.get("/users", auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update user (Admin only)
router.patch("/users/:id", auth, isAdmin, async (req, res) => {
  try {
    const validatedData = userUpdateSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: validatedData },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Validation error", errors: err.errors });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get system settings (Admin only)
router.get("/settings", auth, isAdmin, async (req, res) => {
  try {
    // Implement system settings retrieval
    const settings = {
      workingHours: {
        start: "09:00",
        end: "17:00",
      },
      leaveTypes: [
        "annual",
        "sick",
        "maternity",
        "paternity",
        "unpaid",
        "other",
      ],
      holidays: [], // Implement holiday retrieval
    };
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update system settings (Admin only)
router.patch("/settings", auth, isAdmin, async (req, res) => {
  try {
    const { workingHours, leaveTypes } = req.body;
    // Implement system settings update
    res.json({ message: "Settings updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get all leave requests (Admin only)
router.get("/leaves", auth, isAdmin, async (req, res) => {
  try {
    const { status, type, startDate, endDate } = req.query;
    let query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (startDate && endDate) {
      query.startDate = { $lte: new Date(endDate) };
      query.endDate = { $gte: new Date(startDate) };
    }

    const leaveRequests = await LeaveRequest.find(query)
      .populate("employee", "employeeId user")
      .populate("employee.user", "fullName email")
      .populate("approvedBy", "fullName")
      .sort({ createdAt: -1 });

    res.json(leaveRequests);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get attendance reports (Admin only)
router.get("/reports/attendance", auth, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, employee } = req.query;
    let query = {};

    if (employee) query.employee = employee;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(query)
      .populate("employee", "employeeId user")
      .populate("employee.user", "fullName email")
      .sort({ date: -1 });

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get payroll reports (Admin only)
router.get("/reports/payroll", auth, isAdmin, async (req, res) => {
  try {
    const { month, year } = req.query;
    // Implement payroll report generation
    res.json({ message: "Payroll report generation not implemented yet" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add holiday (Admin only)
router.post("/holidays", auth, isAdmin, async (req, res) => {
  try {
    const validatedData = holidaySchema.parse(req.body);
    // Implement holiday creation
    res.status(201).json({ message: "Holiday added successfully" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Validation error", errors: err.errors });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
