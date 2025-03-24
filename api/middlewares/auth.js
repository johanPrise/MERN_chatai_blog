import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';

const secret = "bj3behrj2o3ierbhj3j2no"; // Consider moving this to environment variables

// Middleware to check if user is authenticated
export const authMiddleware = (req, res, next) => {
  const { token } = req.cookies;
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    const decoded = jwt.verify(token, secret);
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Middleware to check if user is an author or admin
export const authorMiddleware = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.role !== 'author' && user.role !== 'admin') {
      return res.status(403).json({ message: "Author or admin privileges required" });
    }
    
    req.user.role = user.role; // Update role in request
    next();
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

// Middleware to check if user is an admin
export const adminMiddleware = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Admin privileges required" });
    }
    
    next();
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};