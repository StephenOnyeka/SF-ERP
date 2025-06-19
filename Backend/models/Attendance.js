const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: {
      time: {
        type: Date,
        required: true,
      },
      location: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: {
          type: [Number],
          required: false,
        },
      },
    },
    checkOut: {
      time: {
        type: Date,
      },
      location: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: {
          type: [Number],
          required: false,
        },
      },
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half-day"],
      required: true,
    },
    workHours: {
      type: Number,
      default: 0,
    },
    overtime: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for employee and date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Create geospatial index for location
attendanceSchema.index({ "checkIn.location": "2dsphere" });
attendanceSchema.index({ "checkOut.location": "2dsphere" });

// Calculate work hours before saving
attendanceSchema.pre("save", function (next) {
  if (
    this.checkIn &&
    this.checkIn.time &&
    this.checkOut &&
    this.checkOut.time
  ) {
    const hours = (this.checkOut.time - this.checkIn.time) / (1000 * 60 * 60);
    this.workHours = Math.round(hours * 100) / 100;

    // Calculate overtime (assuming 8 hours is a normal work day)
    if (this.workHours > 8) {
      this.overtime = Math.round((this.workHours - 8) * 100) / 100;
    }
  }
  next();
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
