const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    allowances: [
      {
        type: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    deductions: [
      {
        type: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    overtime: {
      hours: {
        type: Number,
        default: 0,
        min: 0,
      },
      rate: {
        type: Number,
        default: 0,
        min: 0,
      },
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "check", "cash"],
    },
    transactionId: {
      type: String,
    },
    notes: {
      type: String,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate net salary before saving
payrollSchema.pre("save", function (next) {
  // Calculate total allowances
  const totalAllowances = this.allowances.reduce(
    (sum, allowance) => sum + allowance.amount,
    0
  );

  // Calculate total deductions
  const totalDeductions = this.deductions.reduce(
    (sum, deduction) => sum + deduction.amount,
    0
  );

  // Calculate overtime amount
  const overtimeAmount = this.overtime.hours * this.overtime.rate;
  this.overtime.amount = overtimeAmount;

  // Calculate net salary
  this.netSalary =
    this.basicSalary + totalAllowances + overtimeAmount - totalDeductions;
  next();
});

// Create compound index for employee and month/year
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

const Payroll = mongoose.model("Payroll", payrollSchema);

module.exports = Payroll;
