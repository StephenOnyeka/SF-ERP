const express = require("express");
const router = express.Router();
const LeaveRequest = require("../models/LeaveRequest");
const Employee = require("../models/Employee");
const { auth, isHR } = require("../middleware/auth");

// Get all leave requests (HR only)
router.get("/", auth, isHR, async (req, res) => {
  try {
    const { employee, status, type, startDate, endDate } = req.query;
    let query = {};

    if (employee) query.employee = employee;
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

// Get employee's leave requests
router.get("/my-leaves", auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const leaveRequests = await LeaveRequest.find({ employee: employee._id })
      .populate("approvedBy", "fullName")
      .sort({ createdAt: -1 });

    res.json(leaveRequests);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create leave request
router.post("/", auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const { startDate, endDate, type, reason, attachments } = req.body;

    // Check for overlapping leave requests
    const overlappingLeave = await LeaveRequest.findOne({
      employee: employee._id,
      status: { $in: ["pending", "approved"] },
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ],
    });

    if (overlappingLeave) {
      return res.status(400).json({
        message: "You have an overlapping leave request for these dates",
      });
    }

    const leaveRequest = new LeaveRequest({
      employee: employee._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type,
      reason,
      attachments,
    });

    await leaveRequest.save();
    res.status(201).json(leaveRequest);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update leave request status (HR only)
router.patch("/:id", auth, isHR, async (req, res) => {
  try {
    const { status, comments } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    if (leaveRequest.status !== "pending") {
      return res.status(400).json({
        message: "Cannot update a non-pending leave request",
      });
    }

    leaveRequest.status = status;
    leaveRequest.comments = comments;
    leaveRequest.approvedBy = req.user._id;
    leaveRequest.approvedAt = new Date();

    await leaveRequest.save();
    res.json(leaveRequest);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Cancel leave request
router.patch("/:id/cancel", auth, async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if the leave request belongs to the employee
    if (leaveRequest.employee.toString() !== employee._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to cancel this leave request",
      });
    }

    if (leaveRequest.status !== "pending") {
      return res.status(400).json({
        message: "Cannot cancel a non-pending leave request",
      });
    }

    leaveRequest.status = "cancelled";
    await leaveRequest.save();
    res.json(leaveRequest);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
