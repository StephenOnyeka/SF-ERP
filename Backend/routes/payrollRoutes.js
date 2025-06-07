const express = require("express");
const router = express.Router();
const Payroll = require("../models/Payroll");
const Employee = require("../models/Employee");
const { auth, isHR } = require("../middleware/auth");

// Get all payroll records (HR only)
router.get("/", auth, isHR, async (req, res) => {
  try {
    const { employee, month, year, status } = req.query;
    let query = {};

    if (employee) query.employee = employee;
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.paymentStatus = status;

    const payrolls = await Payroll.find(query)
      .populate("employee", "employeeId user")
      .populate("employee.user", "fullName email")
      .populate("generatedBy", "fullName")
      .sort({ year: -1, month: -1 });

    res.json(payrolls);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get employee's payroll records
router.get("/my-payroll", auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const { month, year } = req.query;
    let query = { employee: employee._id };

    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const payrolls = await Payroll.find(query)
      .populate("generatedBy", "fullName")
      .sort({ year: -1, month: -1 });

    res.json(payrolls);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Generate payroll (HR only)
router.post("/", auth, isHR, async (req, res) => {
  try {
    const {
      employee,
      month,
      year,
      basicSalary,
      allowances,
      deductions,
      overtime,
      paymentMethod,
      notes,
    } = req.body;

    // Check if payroll already exists for this employee and month/year
    const existingPayroll = await Payroll.findOne({
      employee,
      month: parseInt(month),
      year: parseInt(year),
    });

    if (existingPayroll) {
      return res.status(400).json({
        message: "Payroll already exists for this employee and month/year",
      });
    }

    const payroll = new Payroll({
      employee,
      month: parseInt(month),
      year: parseInt(year),
      basicSalary,
      allowances,
      deductions,
      overtime,
      paymentMethod,
      notes,
      generatedBy: req.user._id,
    });

    await payroll.save();
    res.status(201).json(payroll);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update payroll status (HR only)
router.patch("/:id", auth, isHR, async (req, res) => {
  try {
    const { paymentStatus, paymentDate, transactionId, notes } = req.body;
    if (!["pending", "paid"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    payroll.paymentStatus = paymentStatus;
    if (paymentDate) payroll.paymentDate = new Date(paymentDate);
    if (transactionId) payroll.transactionId = transactionId;
    if (notes) payroll.notes = notes;

    await payroll.save();
    res.json(payroll);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get payroll report (HR only)
router.get("/report", auth, isHR, async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year),
    })
      .populate("employee", "employeeId user")
      .populate("employee.user", "fullName email")
      .sort({ "employee.employeeId": 1 });

    const totalAmount = payrolls.reduce(
      (sum, payroll) => sum + payroll.netSalary,
      0
    );
    const paidCount = payrolls.filter((p) => p.paymentStatus === "paid").length;
    const pendingCount = payrolls.filter(
      (p) => p.paymentStatus === "pending"
    ).length;

    res.json({
      month: parseInt(month),
      year: parseInt(year),
      totalAmount,
      paidCount,
      pendingCount,
      totalCount: payrolls.length,
      payrolls,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
