// middlewares/auth.js
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';

const secret = "bj3behrj2o3ierbhj3j2no";

export const authMiddleware = async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    try {
      const user = await UserModel.findById(info.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = {
        id: user._id,
        username: user.username,
        role: user.role,
        isAuthorized: user.isAuthorized
      };
      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({ message: 'Error finding user' });
    }
  });
};

export const authorMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role === 'author' || req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Author or admin access required' });
  }
};
export const adminMiddleware = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

export const refreshUserInfo = async (req, res, next) => {
  if (req.user) {
    const freshUser = await UserModel.findById(req.user._id);
    if (freshUser) {
      req.user = freshUser;
    }
  }
  next();
};
