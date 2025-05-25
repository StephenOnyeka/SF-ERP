const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    supplierId: {
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
    paymentTerms: {
      type: String,
      default: "Net 30",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blacklisted"],
      default: "active",
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Create indexes for frequently queried fields
supplierSchema.index({ name: 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ email: 1 });

module.exports = mongoose.model("Supplier", supplierSchema);
