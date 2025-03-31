import { authMiddleware } from '../middlewares/auth.js';
import { authUserController } from '../controllers/auth-user.controller.js';

/**
 * Routes combinées pour l'authentification et les opérations utilisateur
 * Cette approche permet de réduire le nombre de fichiers de routes,
 * ce qui est important pour rester sous la limite des 12 fonctions serverless de Vercel Hobby
 */
const authUserRoutes = (app) => {
  // Routes d'authentification
  app.post('/auth/register', authUserController.register);
  app.post('/auth/login', authUserController.login);
  app.post('/auth/forgot-password', authUserController.forgotPassword);
  app.post('/auth/reset-password', authUserController.resetPassword);
  app.post('/auth/logout', authUserController.logout);
  app.get('/auth/verify-email/:token', authUserController.verifyEmail);

  // Routes utilisateur (protégées par authMiddleware)
  app.get('/users/profile', authMiddleware, authUserController.getProfile);
  app.put('/users/profile', authMiddleware, authUserController.updateProfile);
  app.get('/users/:id', authUserController.getUserById);
  app.get('/users', authMiddleware, authUserController.getAllUsers);
  app.delete('/users/:id', authMiddleware, authUserController.deleteUser);
  app.put('/users/change-password', authMiddleware, authUserController.changePassword);
};

export default authUserRoutes;