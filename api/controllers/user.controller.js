import UserModel from '../models/User.js';

export const userController = {
  // Get all users (admin only)
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 10, sort = 'username', order = 'asc', search = '' } = req.query;
      
      // Build base query
      let query = UserModel.find();
      
      // Apply search if a term is provided
      if (search) {
        query = query.or([
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]);
      }
      
      // Count total users matching the search
      const total = await UserModel.countDocuments(query);
      
      // Apply pagination and sorting
      query = query
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));
      
      // Select fields to return (exclude password)
      query = query.select('-password');
      
      // Execute query
      const users = await query.exec();
      
      // Send response
      res.json({
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        totalUsers: total
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        message: 'Server error while fetching users',
        error: error.message
      });
    }
  },
  
  // Check if user is admin
  checkAdmin: (req, res) => {
    console.log('User in check-admin:', req.user.role);
    res.json({ isAdmin: req.user.role === 'admin' });
  },
  
  // Check if user is author or admin
  checkAuthorAdmin: (req, res) => {
    console.log('User in check-author-admin:', req.user.role);
    res.json({ isAuthorOrAdmin: req.user.role === 'author' || req.user.role === 'admin' });
  },
  
  // Update username
  updateUsername: async (req, res) => {
    try {
      const userId = req.user.id;
      const { newUsername } = req.body;
      
      if (!newUsername) {
        return res.status(400).json({ message: 'New username is required' });
      }
      
      const existingUser = await UserModel.findOne({ username: newUsername });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { username: newUsername },
        { new: true }
      );
      
      res.json({ message: 'Username updated successfully', user: updatedUser });
    } catch (error) {
      console.error('Error updating username:', error);
      res.status(500).json({ message: 'Failed to update username' });
    }
  },
  
  // Delete account
  deleteAccount: async (req, res) => {
    try {
      const userId = req.user.id;
      
      await UserModel.findByIdAndDelete(userId);
      
      res.clearCookie('token').json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ message: 'Failed to delete account' });
    }
  },
  
  // Reject author request (admin only)
  rejectAuthor: async (req, res) => {
    try {
      const { userId } = req.body;
      
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Change role to 'user'
      user.role = 'user';
      
      await user.save();
      
      res.json({ message: 'Author request rejected successfully' });
    } catch (error) {
      console.error('Error rejecting author:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};