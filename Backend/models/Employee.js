const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    department: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "intern"],
      default: "full-time",
    },
    salary: {
      type: Number,
      required: true,
    },
    bankDetails: {
      accountNumber: String,
      bankName: String,
      branchCode: String,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    documents: [
      {
        type: {
          type: String,
          enum: ["id", "resume", "certificate", "contract", "other"],
        },
        name: String,
        url: String,
        uploadDate: Date,
      },
    ],
    leaveBalance: {
      annual: { type: Number, default: 20 },
      sick: { type: Number, default: 10 },
      unpaid: { type: Number, default: 0 },
    },
    performance: [
      {
        year: Number,
        rating: Number,
        review: String,
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reviewDate: Date,
      },
    ],
    attendance: [
      {
        date: Date,
        checkIn: Date,
        checkOut: Date,
        status: {
          type: String,
          enum: ["present", "absent", "late", "half-day"],
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "on-leave", "terminated", "suspended"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for frequently queried fields
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });

module.exports = mongoose.model("Employee", employeeSchema);
