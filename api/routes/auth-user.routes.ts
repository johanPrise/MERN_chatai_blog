import { authMiddleware, adminMiddleware } from '../middlewares/auth';
import { authUserController } from '../controllers/auth-user.controller';
import { Request, Response } from 'express';

/**
 * Routes combinées pour l'authentification et les opérations utilisateur
 * Cette approche permet de réduire le nombre de fichiers de routes,
 * ce qui est important pour rester sous la limite des 12 fonctions serverless de Vercel Hobby
 */
const authUserRoutes = (app:any) => {
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

  // Routes pour la vérification des rôles et la gestion des utilisateurs
  app.get('/check-admin', authMiddleware, authUserController.checkAdmin);
  app.get('/check-author-admin', authMiddleware, authUserController.checkAuthorAdmin);
  app.put('/edit-username', authMiddleware, authUserController.updateUsername);

  // Route pour changer le rôle d'un utilisateur (admin seulement)
  app.post('/change-user-role', authMiddleware, adminMiddleware, authUserController.changeUserRole);
};

export default authUserRoutes;