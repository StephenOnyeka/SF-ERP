const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    workingHours: {
      start: {
        type: String,
        required: true,
        default: "09:00",
      },
      end: {
        type: String,
        required: true,
        default: "17:00",
      },
    },
    leaveTypes: [
      {
        type: String,
        enum: ["annual", "sick", "maternity", "paternity", "unpaid", "other"],
      },
    ],
    holidays: [
      {
        name: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          required: true,
        },
        description: String,
      },
    ],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
systemSettingsSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count > 0) {
      throw new Error("Only one system settings document can exist");
    }
  }
  next();
});

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
