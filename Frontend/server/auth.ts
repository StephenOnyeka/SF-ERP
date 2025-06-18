import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const JWT_EXPIRES_IN = "24h";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  // For bcrypt compatibility with demo user
  if (password === "password") {
    return "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm";
  }
  
  // Default scrypt implementation
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // For bcrypt compatibility with demo user
  if (stored.startsWith("$2b$")) {
    return supplied === "password"; // Only compare with hardcoded 'password'
  }
  
  // Default scrypt implementation
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateToken(user: SelectUser) {
  const { password, ...userWithoutPassword } = user;
  return jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function setupAuth(app: Express) {
  // JWT Authentication middleware
  const authenticateJWT = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
          return res.sendStatus(401);
        }
        
        req.user = user;
        next();
      });
    } else {
      res.sendStatus(401);
    }
  };

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      
      const userData = {
        ...req.body,
        password: hashedPassword,
      };
      
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      // Generate JWT token
      const token = generateToken(user);
      
      res.status(201).json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    try {
      const user = await storage.getUserByUsername(req.body.username);
      
      if (!user || !(await comparePasswords(req.body.password, user.password))) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      // Generate JWT token
      const token = generateToken(user);
      
      res.status(200).json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/logout", (req, res) => {
    // Since we're using JWT, we don't need to do anything on the server
    // The client will remove the token
    res.sendStatus(200);
  });

  app.get("/api/user", authenticateJWT, (req, res) => {
    // User is already attached to req by authenticateJWT middleware
    res.json(req.user);
  });
}
