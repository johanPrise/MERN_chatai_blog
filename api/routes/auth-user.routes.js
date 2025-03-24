import { authMiddleware } from '../middlewares/auth.js';
import { authController } from '../controllers/auth.controller.js';
import { userController } from '../controllers/user.controller.js';

/**
 * Routes combinées pour l'authentification et les opérations utilisateur
 * Cette approche permet de réduire le nombre de fichiers de routes,
 * ce qui est important pour rester sous la limite des 12 fonctions serverless de Vercel Hobby
 */
const authUserRoutes = (app) => {
  // Routes d'authentification
  app.post('/auth/register', authController.register);
  app.post('/auth/login', authController.login);
  app.post('/auth/forgot-password', authController.forgotPassword);
  app.post('/auth/reset-password', authController.resetPassword);
  app.post('/auth/logout', authController.logout);
  app.get('/auth/verify-email/:token', authController.verifyEmail);

  // Routes utilisateur (protégées par authMiddleware)
  app.get('/users/profile', authMiddleware, userController.getProfile);
  app.put('/users/profile', authMiddleware, userController.updateProfile);
  app.get('/users/:id', userController.getUserById);
  app.get('/users', authMiddleware, userController.getAllUsers);
  app.delete('/users/:id', authMiddleware, userController.deleteUser);
  app.put('/users/change-password', authMiddleware, userController.changePassword);
};

export default authUserRoutes;