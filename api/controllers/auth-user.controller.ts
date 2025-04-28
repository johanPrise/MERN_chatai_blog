import User from '../models/User';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { emailService } from '../services/email.service';
import crypto from 'crypto';
import { IUser } from '../types/User';
import type { ExtendedRequest, ExtendedResponse, AuthRequest } from '../types/express.d.ts';

export const authUserController = {
  // Auth methods
  register: async (req: ExtendedRequest, res: ExtendedResponse) => {
    try {
      const { email, password, username } = req.body;

      // Check if user already exists
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      const user: IUser = new User({
        email,
        password,
        username,
      });

      await (user as any).save();

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) throw new Error('JWT_SECRET non défini');

      const token = jwt.sign({ id: (user as any)._id }, jwtSecret, {
        expiresIn: '30d',
      });

      res.status(201).json({
        user: {
          id: (user as any)._id,
          email: user.email,
          username: user.username,
        },
        token,
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },

  login: async (req: ExtendedRequest, res: ExtendedResponse) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email }).select('+password') as IUser | null;
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) throw new Error('JWT_SECRET non défini');

      const token = jwt.sign({ id: (user as any)._id }, jwtSecret, {
        expiresIn: '30d',
      });

      res.status(200).json({
        user: {
          id: (user as any)._id,
          email: user.email,
          username: user.username,
        },
        token,
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },

  logout: async (_req: ExtendedRequest, res: ExtendedResponse) => {
    try {
      // Since JWT is stateless, the client should handle token deletion
      // Server can't invalidate tokens, but we can acknowledge the logout
      res.status(200).json({ message: 'Logged out successfully' });

      // If using refresh tokens, you would delete them here
      // await RefreshToken.findOneAndDelete({ user: req.user.id });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },

  forgotPassword: async (req: ExtendedRequest, res: ExtendedResponse) => {
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
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

      await user.save();

      // Generate reset URL
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

      // Send email
      await emailService.sendPasswordResetEmail(user.email, resetUrl);

      res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },

  resetPassword: async (req: ExtendedRequest, res: ExtendedResponse) => {
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
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },

  verifyEmail: async (req: ExtendedRequest, res: ExtendedResponse) => {
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
      const userAny = user as any;
      userAny.isEmailVerified = true;
      userAny.emailVerificationToken = undefined;
      userAny.emailVerificationExpires = undefined;

      await user.save();

      res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },

  // User methods
  getProfile: async (req: AuthRequest, res: ExtendedResponse) => {
    try {
      const user = await User.findById(req.user.id).select('-password') as IUser | null;
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },

  getUserById: async (req: ExtendedRequest, res: ExtendedResponse) => {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },

  getAllUsers: async (req: ExtendedRequest, res: ExtendedResponse) => {
    try {
      // Pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
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
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },

  updateProfile: async (req: AuthRequest, res: ExtendedResponse) => {
    try {
      const { username, email, bio } = req.body;

      // Find and update user
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { username, email, bio },
        { new: true, runValidators: true }
      ).select('-password') as IUser | null;

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },

  changePassword: async (req: AuthRequest, res: ExtendedResponse) => {
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
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },

  deleteUser: async (req: ExtendedRequest, res: ExtendedResponse) => {
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
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },

  deleteAccount: async (req: AuthRequest, res: ExtendedResponse) => {
    try {
      await User.findByIdAndDelete(req.user.id);
      res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },

  // Vérifier si l'utilisateur est admin
  checkAdmin: (req: AuthRequest, res: ExtendedResponse) => {
    console.log('User in check-admin:', req.user.role);
    res.json({ isAdmin: req.user.role === 'admin' });
  },

  // Vérifier si l'utilisateur est author ou admin
  checkAuthorAdmin: (req: AuthRequest, res: ExtendedResponse) => {
    console.log('User in check-author-admin:', req.user.role);
    res.json({ isAuthorOrAdmin: req.user.role === 'author' || req.user.role === 'admin' });
  },

  // Mettre à jour le username
  updateUsername: async (req: AuthRequest, res: ExtendedResponse) => {
    try {
      const userId = req.user.id;
      const { newUsername } = req.body;

      if (!newUsername) {
        return res.status(400).json({ message: 'New username is required' });
      }

      const existingUser = await User.findOne({ username: newUsername });

      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { username: newUsername },
        { new: true }
      ) as IUser | null;

      res.json({ message: 'Username updated successfully', user: updatedUser });
    } catch (error) {
      console.error('Error updating username:', error);
      res.status(500).json({ message: 'Failed to update username' });
    }
  },

  // Refuser une demande d'auteur (admin seulement)
  rejectAuthor: async (req: AuthRequest, res: ExtendedResponse) => {
    try {
      const { userId } = req.body;

      const user = await User.findById(userId) as IUser | null;

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Change role to 'user'
      (user as any).role = 'user';

      await (user as any).save();

      res.json({ message: 'Author request rejected successfully' });
    } catch (error) {
      console.error('Error rejecting author:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Changer le rôle d'un utilisateur (admin seulement)
  changeUserRole: async (req: ExtendedRequest, res: ExtendedResponse) => {
    try {
      const { userId, newRole } = req.body;

      if (!userId || !newRole) {
        return res.status(400).json({ message: 'User ID and new role are required' });
      }

      if (!['user', 'author', 'admin'].includes(newRole)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Changer le rôle de l'utilisateur
      user.role = newRole;

      await user.save();

      res.json({
        message: `User role changed to ${newRole} successfully`,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error changing user role:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
};
