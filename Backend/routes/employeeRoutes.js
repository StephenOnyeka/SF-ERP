const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const User = require("../models/User");
const { z } = require("zod");

// Validation schema for employee
const employeeSchema = z.object({
  user: z.string(),
  department: z.string().min(1),
  position: z.string().min(1),
  employmentType: z.enum(["full-time", "part-time", "contract", "intern"]),
  salary: z.number().min(0),
  bankDetails: z
    .object({
      accountNumber: z.string().optional(),
      bankName: z.string().optional(),
      branchCode: z.string().optional(),
    })
    .optional(),
  emergencyContact: z
    .object({
      name: z.string().optional(),
      relationship: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
});

// Get all employees
router.get("/", async (req, res) => {
  try {
    const { department, status, search } = req.query;
    let query = {};

    if (department) query.department = department;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { "user.fullName": { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const employees = await Employee.find(query)
      .populate("user", "fullName email role")
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get single employee
router.get("/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("user", "fullName email role")
      .populate("performance.reviewedBy", "fullName");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create employee
router.post("/", async (req, res) => {
  try {
    const validatedData = employeeSchema.parse(req.body);

    // Generate employeeId
    const lastEmployee = await Employee.findOne().sort({ employeeId: -1 });
    let newId = 1;
    if (lastEmployee && lastEmployee.employeeId) {
      const match = lastEmployee.employeeId.match(/EMP-(\d+)/);
      if (match) {
        newId = parseInt(match[1], 10) + 1;
      }
    }
    const employeeId = `EMP-${newId.toString().padStart(6, "0")}`;

    const employee = new Employee({
      ...validatedData,
      employeeId,
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (err) {
    if (err.name === "ZodError") {
      return res
        .status(400)
        .json({ message: "Invalid data", errors: err.errors });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update employee
router.put("/:id", async (req, res) => {
  try {
    const validatedData = employeeSchema.parse(req.body);
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true }
    );
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee);
  } catch (err) {
    if (err.name === "ZodError") {
      return res
        .status(400)
        .json({ message: "Invalid data", errors: err.errors });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add performance review
router.post("/:id/performance", async (req, res) => {
  try {
    const { year, rating, review, reviewedBy } = req.body;
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.performance.push({
      year,
      rating,
      review,
      reviewedBy,
      reviewDate: new Date(),
    });

    await employee.save();
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update employee status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "on-leave", "terminated", "suspended"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    employee.status = status;
    await employee.save();
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
