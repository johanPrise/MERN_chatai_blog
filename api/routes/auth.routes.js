import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const authRoutes = (app) => {
  // Authentication routes
  app.post('/register', authController.register);
  app.post('/login', authController.login);
  app.post('/logout', authController.logout);
  app.get('/profile', authMiddleware, authController.getProfile);
  app.get('/verify-session', authMiddleware, authController.verifySession);
  
  // Password reset routes
  app.post('/forgot-password', authController.forgotPassword);
  app.post('/reset-password/:resetToken', authController.resetPassword);
};

export default authRoutes;