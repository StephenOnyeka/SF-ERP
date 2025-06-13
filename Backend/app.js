const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const MemoryStore = require("memorystore")(session);
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { z } = require("zod");
const User = require("./models/User");

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:5000", // Frontend URL
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/employees", require("./routes/employeeRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/leaves", require("./routes/leaveRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// Validation schemas
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

// Auth routes
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

    console.log("Parsed registration data:", {
      username,
      email,
      firstName,
      lastName,
      role,
      department,
      position,
    });

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      console.log("User already exists:", existingUser.username);
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

    console.log("Generated companyId:", companyId);

    const newUser = new User({
      username,
      password, // Password will be hashed by the pre-save hook
      fullName: `${firstName} ${lastName}`,
      email,
      role: assignedRole,
      companyId,
      department,
      position,
      profileImage,
    });

    console.log("Creating new user with data:", {
      username: newUser.username,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      companyId: newUser.companyId,
    });

    await newUser.save();
    console.log("User saved successfully to database");

    // Don't return password
    const userObj = newUser.toObject();
    delete userObj.password;

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    // Set the token in a cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600000, // 1 hour
    });

    console.log("Registration complete, sending response");
    res.status(201).json({
      message: "User registered successfully",
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

app.post("/api/login", async (req, res) => {
  console.log("Login request received:", req.body);
  const { username, email, password } = req.body;

  try {
    // Find user by either username or email
    const user = await User.findOne({
      $or: [{ username: username || email }, { email: email || username }],
    });

    if (!user) {
      console.log("Login failed: User not found for", username || email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("User found:", {
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // Compare password
    const isMatch = await user.comparePassword(password);
    console.log("Password comparison result:", isMatch);

    if (!isMatch) {
      console.log("Login failed: Invalid password for user", user.username);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    // Set the token in a cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600000, // 1 hour
    });

    const userObj = user.toObject();
    delete userObj.password;

    console.log("Login successful for user:", user.username);
    res.json({ user: userObj });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.get("/", (req, res) => {
  res.send("SForger-ERP API is running.");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
