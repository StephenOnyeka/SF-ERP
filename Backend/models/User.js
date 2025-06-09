const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { scryptAsync, timingSafeEqual } = require("crypto");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "hr", "employee"],
      default: "employee",
    },
    companyId: {
      type: String,
      required: true,
      unique: true,
      match: /^SF-\d{3}$/,
    },
    department: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    // Check if password is bcrypt hashed
    if (this.password.startsWith('$2')) {
      return bcrypt.compare(candidatePassword, this.password);
    }
    
    // Handle scrypt hashed password
    const [hash, salt] = this.password.split('.');
    const buf = (await scryptAsync(candidatePassword, salt, 64)) as Buffer;
    return timingSafeEqual(Buffer.from(hash, 'hex'), buf);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Add index for faster queries
userSchema.index({ username: 1, email: 1 });
userSchema.index({ companyId: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
