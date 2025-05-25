require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const demoUsers = [
  {
    fullName: "Admin User",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
  },
  {
    fullName: "HR Manager",
    email: "hr@example.com",
    password: "hr123",
    role: "hr",
  },
  {
    fullName: "John Doe",
    email: "john@example.com",
    password: "employee123",
    role: "employee",
  },
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing users
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Create demo users
    const users = await User.insertMany(demoUsers);
    console.log(
      "Created demo users:",
      users.map((user) => ({
        email: user.email,
        role: user.role,
      }))
    );

    console.log("Seeding completed successfully");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedUsers();
