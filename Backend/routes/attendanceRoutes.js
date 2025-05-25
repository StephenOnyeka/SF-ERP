const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const { auth, isHR } = require("../middleware/auth");
const { z } = require("zod");

// Validation schema for attendance
const attendanceSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  checkIn: z.object({
    time: z.string().transform((str) => new Date(str)),
    location: z.object({
      coordinates: z.array(z.number()).length(2),
    }),
  }),
  checkOut: z
    .object({
      time: z.string().transform((str) => new Date(str)),
      location: z.object({
        coordinates: z.array(z.number()).length(2),
      }),
    })
    .optional(),
  status: z.enum(["present", "absent", "late", "half-day"]),
  notes: z.string().optional(),
});

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

// Record check-in
router.post("/check-in", auth, async (req, res) => {
  try {
    const { location } = req.body;
    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      employee: employee._id,
      date: today,
    });

    if (attendance) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    // Determine if late (assuming work starts at 9 AM)
    const checkInTime = new Date();
    const isLate = checkInTime.getHours() >= 9 && checkInTime.getMinutes() > 0;

    attendance = new Attendance({
      employee: employee._id,
      date: today,
      checkIn: {
        time: checkInTime,
        location: {
          coordinates: location,
        },
      },
      status: isLate ? "late" : "present",
    });

    await attendance.save();
    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Record check-out
router.post("/check-out", auth, async (req, res) => {
  try {
    const { location } = req.body;
    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: today,
    });

    if (!attendance) {
      return res
        .status(400)
        .json({ message: "No check-in record found for today" });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: "Already checked out today" });
    }

    attendance.checkOut = {
      time: new Date(),
      location: {
        coordinates: location,
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
