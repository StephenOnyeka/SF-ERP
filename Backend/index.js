// Basic Express server setup for user authentication with MongoDB
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5000", "http://localhost:3000"], // Allow both dev frontend ports
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);
app.use(express.json());

// MongoDB User model
const mongoose = require("mongoose");
const User = require("./models/User");

// Import routes
const employeeRoutes = require("./routes/employeeRoutes");

// Connect to MongoDB
console.log("Connecting to MongoDB...");

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/sforger-erp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

app.get("/", (req, res) => {
  res.send("SForger-ERP API is running.");
});

// Register route (MongoDB)
const { z } = require("zod");

// Zod schema matching frontend shared/schema.ts
const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  profileImage: z.string().optional(),
});

app.post("/api/register", async (req, res) => {
  console.log("Register request body:", req.body);
  try {
    // Validate request body
    const parsed = registerSchema.parse(req.body);
    const {
      username,
      password,
      firstName,
      lastName,
      email,
      role,
      department,
      position,
      profileImage,
    } = parsed;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.username === username
            ? "Username already exists"
            : "Email already exists",
      });
    }

    // Assign companyId logic
    let assignedRole = role || "employee";
    let companyId = "";
    if (assignedRole === "admin") {
      companyId = "SF-001";
    } else if (assignedRole === "hr") {
      companyId = "SF-002";
    } else {
      // Find max companyId for employee, increment
      const lastEmployee = await User.find({ role: "employee" })
        .sort({ companyId: -1 })
        .limit(1);
      let lastId = 4;
      if (lastEmployee.length > 0 && lastEmployee[0].companyId) {
        const match = lastEmployee[0].companyId.match(/SF-(\d+)/);
        if (match) {
          lastId = parseInt(match[1], 10) + 1;
        }
      }
      companyId = `SF-${lastId.toString().padStart(3, "0")}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      fullName: `${firstName} ${lastName}`,
      email,
      role: assignedRole,
      companyId,
      department,
      position,
      profileImage,
    });

    await newUser.save();

    // Don't return password
    const userObj = newUser.toObject();
    delete userObj.password;

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "8h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: userObj,
    });
  } catch (err) {
    console.error("Registration error:", err);
    if (err.name === "ZodError") {
      return res
        .status(400)
        .json({ message: "Invalid data", errors: err.errors });
    }
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Signin route (MongoDB)
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "8h" }
    );
    const userObj = user.toObject();
    delete userObj.password;
    res.json({ token, user: userObj });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get current user info from JWT
app.get("/api/user", async (req, res) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization header received:", authHeader); // Debug log
  if (!authHeader) return res.status(401).json({ message: "No token" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("JWT error:", err); // Debug log
    res.status(401).json({ message: "Invalid token" });
  }
});

// Admin: Change user role
app.post("/api/admin/change-role", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const adminUser = await User.findById(decoded.userId);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ message: "Only admin can change roles" });
    }
    const { userId, newRole } = req.body;
    if (!["admin", "hr", "employee"].includes(newRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    // Assign companyId for admin/hr if needed
    let companyId = user.companyId;
    if (newRole === "admin") {
      companyId = "SF-001";
    } else if (newRole === "hr") {
      companyId = "SF-002";
    } else if (user.role !== "employee" && newRole === "employee") {
      // Find last employee companyId
      const lastEmployee = await User.find({ role: "employee" })
        .sort({ companyId: -1 })
        .limit(1);
      let lastId = 4;
      if (lastEmployee.length > 0 && lastEmployee[0].companyId) {
        const match = lastEmployee[0].companyId.match(/SF-(\d+)/);
        if (match) {
          lastId = parseInt(match[1], 10) + 1;
        }
      }
      companyId = `SF-${lastId.toString().padStart(3, "0")}`;
    }
    user.role = newRole;
    user.companyId = companyId;
    await user.save();
    res.json({ message: "Role updated", user });
  } catch (err) {
    res
      .status(401)
      .json({ message: "Invalid token or server error", error: err.message });
  }
});

// Filter users by role
app.get("/api/users", async (req, res) => {
  const { role } = req.query;
  let filter = {};
  if (role && ["admin", "hr", "employee"].includes(role)) {
    filter.role = role;
  }
  const users = await User.find(filter).select("-password");
  res.json(users);
});

// Use employee routes
app.use("/api/employees", employeeRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
