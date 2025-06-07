const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const { auth, isHR } = require("../middleware/auth");

// Get all attendance records (HR only)
router.get("/", auth, isHR, async (req, res) => {
  try {
    const { employee, startDate, endDate, status } = req.query;
    let query = {};

    if (employee) query.employee = employee;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(query)
      .populate("employee", "employeeId user")
      .populate("employee.user", "fullName email")
      .populate("verifiedBy", "fullName")
      .sort({ date: -1 });

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get employee's attendance records
router.get("/my-attendance", auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const { startDate, endDate } = req.query;
    let query = { employee: employee._id };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendance = await Attendance.find(query)
      .populate("verifiedBy", "fullName")
      .sort({ date: -1 });

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Check-in
router.post("/check-in", auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const { location } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employee: employee._id,
      date: today,
    });

    if (existingAttendance) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    const attendance = new Attendance({
      employee: employee._id,
      date: today,
      checkIn: {
        time: new Date(),
        location: {
          type: "Point",
          coordinates: [location.longitude, location.latitude],
        },
      },
      status: "present",
    });

    await attendance.save();
    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Check-out
router.post("/check-out", auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const { location } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: today,
    });

    if (!attendance) {
      return res
        .status(404)
        .json({ message: "No check-in record found for today" });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: "Already checked out today" });
    }

    attendance.checkOut = {
      time: new Date(),
      location: {
        type: "Point",
        coordinates: [location.longitude, location.latitude],
      },
    };

    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update attendance record (HR only)
router.patch("/:id", auth, isHR, async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!["present", "absent", "late", "half-day"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    attendance.status = status;
    attendance.notes = notes;
    attendance.verifiedBy = req.user._id;

    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
