import { authMiddleware } from '../middlewares/auth';
import { contentController } from '../controllers/content.controller';
import express from 'express';

/**
 * Routes combinées pour la gestion du contenu (posts, catégories, commentaires)
 * Cette approche permet de réduire le nombre de fichiers de routes,
 * ce qui est important pour rester sous la limite des 12 fonctions serverless de Vercel Hobby
 */
const contentRoutes = (app: any) => {
  // Routes des posts
  app.get('/posts', contentController.getAllPosts);
  app.get('/posts/:id', contentController.getPostById);
  app.post('/posts', authMiddleware, contentController.createPost);
  app.put('/posts/:id', authMiddleware, contentController.updatePost);
  app.delete('/posts/:id', authMiddleware, contentController.deletePost);
  
  // Routes des catégories
  app.get('/categories', contentController.getAllCategories);
  app.get('/categories/:id', contentController.getCategoryById);
  app.get('/category/:id', contentController.getCategoryById);
  app.post('/categories', authMiddleware, contentController.createCategory);
  app.put('/categories/:id', authMiddleware, contentController.updateCategory);
  app.delete('/categories/:id', authMiddleware, contentController.deleteCategory);
  
  // Routes des commentaires
  app.get('/posts/:postId/comments', contentController.getCommentsByPost);
  app.post('/posts/:postId/comments', authMiddleware, contentController.addComment);
  app.put('/comments/:id', authMiddleware, contentController.updateComment);
  app.delete('/comments/:id', authMiddleware, contentController.deleteComment);
};

export default contentRoutes;
