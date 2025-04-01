import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { emailService } from '../services/email.service.js';
import crypto from 'crypto';

export const authUserController = {
  // Auth methods
  register: async (req, res) => {
    try {
      const { email, password, username } = req.body;
      
      // Check if user already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Create new user
      const user = new User({
        email,
        password,
        username,
      });
      
      await user.save();
      
      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
      });
      
      res.status(201).json({
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
        },
        token,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
      });
      
      res.status(200).json({
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
        },
        token,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  logout: async (req, res) => {
    try {
      // Since JWT is stateless, the client should handle token deletion
      // Server can't invalidate tokens, but we can acknowledge the logout
      res.status(200).json({ message: 'Logged out successfully' });
      
      // If using refresh tokens, you would delete them here
      // await RefreshToken.findOneAndDelete({ user: req.user.id });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Generate reset token
      const resetToken = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      
      await user.save();
      
      // Generate reset URL
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
      
      // Send email
      await emailService.sendPasswordResetEmail(user.email, resetUrl);
      
      res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  resetPassword: async (req, res) => {
    try {
      const { token, password } = req.body;
      
      // Find user with token
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
      
      // Update password
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      
      await user.save();
      
      res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.params;
      
      // Verify token and find user
      const user = await User.findOne({ 
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired verification token' });
      }
      
      // Update user verification status
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      
      await user.save();
      
      res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  // User methods
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  getAllUsers: async (req, res) => {
    try {
      // Pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Query users with pagination
      const users = await User.find()
        .select('-password')
        .skip(skip)
        .limit(limit);
      
      // Get total count for pagination
      const total = await User.countDocuments();
      
      res.status(200).json({
        users,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  updateProfile: async (req, res) => {
    try {
      const { username, email, bio } = req.body;
      
      // Find and update user
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { username, email, bio },
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Find user
      const user = await User.findById(req.user.id).select('+password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      // Update password
      user.password = newPassword;
      await user.save();
      
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Only admin users should be able to delete other users
      // Implement additional authorization checks here if needed
      
      const deletedUser = await User.findByIdAndDelete(id);
      
      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  deleteAccount: async (req, res) => {
    try {
      await User.findByIdAndDelete(req.user.id);
      res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};
