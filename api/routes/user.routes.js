import { userController } from '../controllers/user.controller.js';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.js';

const userRoutes = (app) => {
  // Get all users (admin only)
  app.get('/users', authMiddleware, adminMiddleware, userController.getAllUsers);
  
  // Check if user is admin
  app.get('/check-admin', authMiddleware, adminMiddleware, userController.checkAdmin);
  
  // Check if user is author or admin
  app.get('/check-author-admin', authMiddleware, userController.checkAuthorAdmin);
  
  // Update username
  app.put('/edit-username', authMiddleware, userController.updateUsername);
  
  // Delete account
  app.delete('/delete-account', authMiddleware, userController.deleteAccount);
  
  // Reject author request (admin only)
  app.post('/reject-author', authMiddleware, adminMiddleware, userController.rejectAuthor);
};

export default userRoutes;