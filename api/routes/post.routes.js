import { postController } from '../controllers/post.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const postRoutes = (app) => {
  // Post routes
  app.get('/post', postController.getAllPosts);
  app.get('/post/:id', postController.getPostById);
  app.post('/create_post', authMiddleware, postController.createPost);
  app.put('/post/:id', authMiddleware, postController.updatePost);
  app.delete('/post/:id', authMiddleware, postController.deletePost);
  
  // Post interaction routes
  app.post('/post/:id/like', authMiddleware, postController.likePost);
  app.post('/post/:id/dislike', authMiddleware, postController.dislikePost);
};

export default postRoutes;