import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';
import { emailService } from '../services/email.service.js';

const secret = "bj3behrj2o3ierbhj3j2no";
const resetPasswordSecret = "6a51acbeed5589caef8465b83e2bedb346e3c9a512867eff00431e31cb73e469";
const salt = bcrypt.genSaltSync(10);

export const authController = {
  // Register a new user
  register: async (req, res) => {
    const { username, password, email, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, salt);
    
    try {
      const userDoc = await UserModel.create({
        username,
        password: hashedPassword,
        email,
        role,
        isAuthorized: role === 'user' // Normal users are authorized by default
      });
      
      res.json(userDoc);
    } catch (error) {
      res.status(400).json(error);
    }
  },
  
  // Login user
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json("Username et password requis");
      }
      
      const userDoc = await UserModel.findOne({ username }).select('+password');
      
      if (!userDoc) {
        return res.status(401).json("Identifiants invalides");
      }
      
      const passOk = bcrypt.compareSync(password, userDoc.password);
      
      if (!passOk) {
        return res.status(401).json("Identifiants invalides");
      }
      
      const token = jwt.sign(
        { id: userDoc._id, username: userDoc.username, role: userDoc.role },
        secret,
        { expiresIn: '15d' }
      );
      
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        domain: '.vercel.app', // Important for subdomains
        maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days
      }).json(userDoc);
    } catch (error) {
      console.error('Erreur login:', error);
      res.status(500).json("Erreur serveur interne");
    }
  },
  
  // Logout user
  logout: (req, res) => {
    res.cookie("token", "").json("ok");
  },
  
  // Get user profile
  getProfile: (req, res) => {
    const { token } = req.cookies;
    
    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
      }
      
      const user = await UserModel.findById(info.id);
      
      res.json({
        id: user._id,
        username: user.username,
        role: user.role
      });
    });
  },
  
  // Verify user session
  verifySession: (req, res) => {
    res.json({
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    });
  },
  
  // Forgot password
  forgotPassword: async (req, res) => {
    const { email } = req.body;
    
    try {
      const user = await UserModel.findOne({ email });
      
      if (!user) {
        return res.status(404).json({ message: 'Email not registered' });
      }
      
      // Generate reset token
      const resetToken = jwt.sign({ userId: user._id }, resetPasswordSecret, { expiresIn: '1h' });
      
      // Save token to database
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();
      
      // Send email with reset link
      const resetUrl = `https://mern-chatai-blog.vercel.app/reset-password/${resetToken}`;
      await emailService.sendPasswordResetEmail(email, resetUrl);
      
      res.status(200).json({ message: 'Password reset email sent' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  // Reset password
  resetPassword: async (req, res) => {
    const { resetToken } = req.params;
    const { password } = req.body;
    
    try {
      // Verify token
      const decoded = jwt.verify(resetToken, resetPasswordSecret);
      
      // Find user
      const user = await UserModel.findOne({
        _id: decoded.userId
      });
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
      
      // Hash new password and update user
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      await user.save();
      
      res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
      console.error(err);
      
      if (err.name === 'TokenExpiredError') {
        res.status(400).json({ message: 'Token expired' });
      } else if (err.name === 'JsonWebTokenError') {
        res.status(400).json({ message: 'Invalid token' });
      } else {
        res.status(500).json({ message: 'Server error' });
      }
    }
  }
};