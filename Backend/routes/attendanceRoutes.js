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

    // Map fields for frontend compatibility
    const mapped = attendance.map((a) => ({
      ...a.toObject(),
      checkInTime: a.checkIn?.time,
      checkOutTime: a.checkOut?.time,
      id: a._id,
    }));

    res.json(mapped);
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
      // Parse as UTC midnight
      const start = new Date(startDate + "T00:00:00.000Z");
      const end = new Date(endDate + "T23:59:59.999Z");
      query.date = {
        $gte: start,
        $lte: end,
      };
      console.log("Attendance query:", query);
    }

    const attendance = await Attendance.find(query)
      .populate("verifiedBy", "fullName")
      .sort({ date: -1 });

    console.log("Attendance results:", attendance.length, attendance.map(a => a.date));

    // Map fields for frontend compatibility
    const mapped = attendance.map((a) => ({
      ...a.toObject(),
      checkInTime: a.checkIn?.time,
      checkOutTime: a.checkOut?.time,
      id: a._id,
    }));

    res.json(mapped);
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

    const attendanceData = {
      employee: employee._id,
      date: today,
      checkIn: {
        time: new Date(),
      },
      status: "present",
    };
    if (location && location.longitude && location.latitude) {
      attendanceData.checkIn.location = {
        type: "Point",
        coordinates: [location.longitude, location.latitude],
      };
    }

    const attendance = new Attendance(attendanceData);
    await attendance.save();
    res.status(201).json(attendance);
  } catch (err) {
    console.error("Check-in error:", err);
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

    if (attendance.checkOut && attendance.checkOut.time) {
      return res.status(400).json({ message: "Already checked out today" });
    }

    attendance.checkOut = {
      time: new Date(),
    };
    if (location && location.longitude && location.latitude) {
      attendance.checkOut.location = {
        type: "Point",
        coordinates: [location.longitude, location.latitude],
      };
    }

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
