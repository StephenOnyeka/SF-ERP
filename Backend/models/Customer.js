const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    contactPerson: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    creditLimit: {
      type: Number,
      default: 0,
    },
    paymentTerms: {
      type: String,
      default: "Net 30",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    type: {
      type: String,
      enum: ["retail", "wholesale", "corporate"],
      default: "retail",
    },
    taxId: String,
    notes: String,
    lastOrderDate: Date,
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for frequently queried fields
customerSchema.index({ name: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ type: 1 });

module.exports = mongoose.model("Customer", customerSchema);
