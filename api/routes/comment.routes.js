import { commentController } from '../controllers/comment.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const commentRoutes = (app) => {
  // Get comments for a post
  app.get('/comments/:postId', commentController.getCommentsByPostId);
  
  // Create a new comment
  app.post('/comment', authMiddleware, commentController.createComment);
  
  // Update a comment
  app.put('/comment/:commentId', authMiddleware, commentController.updateComment);
  
  // Delete a comment
  app.delete('/comment/:commentId', authMiddleware, commentController.deleteComment);
  
  // Like a comment
  app.post('/comment/:commentId/like', authMiddleware, commentController.likeComment);
  
  // Dislike a comment
  app.post('/comment/:commentId/dislike', authMiddleware, commentController.dislikeComment);
};

export default commentRoutes;