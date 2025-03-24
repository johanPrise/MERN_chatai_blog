import CommentModel from '../models/Comments.js';

export const commentController = {
  // Get comments for a post
  getCommentsByPostId: async (req, res) => {
    const { postId } = req.params;
    
    try {
      const comments = await CommentModel.find({ post: postId })
        .populate('author', ['username'])
        .sort({ createdAt: -1 });
      
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  // Create a new comment
  createComment: async (req, res) => {
    try {
      const { content, postId } = req.body;
      
      const commentDoc = await CommentModel.create({
        content,
        author: req.user.id,
        post: postId,
      });
      
      res.json(commentDoc);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  // Update a comment
  updateComment: async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    try {
      const comment = await CommentModel.findById(commentId);
      
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      if (comment.author.toString() !== userId) {
        return res.status(403).json({ message: 'Not authorized to edit this comment' });
      }
      
      comment.content = content;
      await comment.save();
      
      res.json(comment);
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  // Delete a comment
  deleteComment: async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;
    
    try {
      const comment = await CommentModel.findById(commentId);
      
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      if (comment.author.toString() !== userId) {
        return res.status(403).json({ message: 'Not authorized to delete this comment' });
      }
      
      await CommentModel.findByIdAndDelete(commentId);
      
      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  // Like a comment
  likeComment: async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;
    
    try {
      const comment = await CommentModel.findById(commentId);
      
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      const likeIndex = comment.likes.indexOf(userId);
      const dislikeIndex = comment.dislikes.indexOf(userId);
      
      if (likeIndex > -1) {
        // User already liked, remove the like
        comment.likes.splice(likeIndex, 1);
      } else {
        // User hasn't liked yet, add the like
        comment.likes.push(userId);
        
        // If user had disliked, remove the dislike
        if (dislikeIndex > -1) {
          comment.dislikes.splice(dislikeIndex, 1);
        }
      }
      
      await comment.save();
      
      res.json({ likes: comment.likes, dislikes: comment.dislikes });
    } catch (error) {
      console.error('Error liking comment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  // Dislike a comment
  dislikeComment: async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;
    
    try {
      const comment = await CommentModel.findById(commentId);
      
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      const likeIndex = comment.likes.indexOf(userId);
      const dislikeIndex = comment.dislikes.indexOf(userId);
      
      if (dislikeIndex > -1) {
        // User already disliked, remove the dislike
        comment.dislikes.splice(dislikeIndex, 1);
      } else {
        // User hasn't disliked yet, add the dislike
        comment.dislikes.push(userId);
        
        // If user had liked, remove the like
        if (likeIndex > -1) {
          comment.likes.splice(likeIndex, 1);
        }
      }
      
      await comment.save();
      
      res.json({ likes: comment.likes, dislikes: comment.dislikes });
    } catch (error) {
      console.error('Error disliking comment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};