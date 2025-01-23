import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';

const secret = "bj3behrj2o3ierbhj3j2no";

export const cookieOptions = {
    httpOnly: true,
    path: '/',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 15 * 24 * 60 * 60 * 1000
  };
  
  export const authMiddleware = async (req, res, next) => {
    try {
      const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }
  
      const info = await verifyToken(token);
      const user = await UserModel.findById(info.id);
  
      if (!user) {
        res.clearCookie('token', cookieOptions);
        return res.status(401).json({ message: 'User not found' });
      }
  
      req.user = {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        isAuthorized: user.isAuthorized
      };
      
      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.clearCookie('token', cookieOptions);
      res.status(401).json({ message: 'Invalid or expired token' });
    }
  };