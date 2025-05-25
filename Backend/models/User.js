const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ["admin", "hr", "employee"], default: "employee" },
  companyId: { type: String, required: true, unique: true },
  department: { type: String },
  position: { type: String },
  profileImage: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
