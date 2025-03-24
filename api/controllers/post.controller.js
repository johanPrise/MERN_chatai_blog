import PostModel from '../models/Post.js';
import CommentModel from '../models/Comments.js';
import { fileService } from '../services/file.service.js';

export const postController = {
  // Get all posts
  getAllPosts: async (req, res) => {
    try {
      const posts = await PostModel.find()
        .populate('author', ['username'])
        .sort({ createdAt: -1 })
        .limit(20);
      
      res.json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  // Get a post by ID
  getPostById: async (req, res) => {
    const { id } = req.params;
    
    try {
      const post = await PostModel.findById(id).populate('author', ['username']);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      res.json(post);
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  // Create a new post
  createPost: async (req, res) => {
    try {
      const { title, summary, content, category, featured, cover } = req.body;
      
      const newPost = new PostModel({
        title,
        summary,
        content,
        cover,
        author: req.user.id,
        category,
        featured: featured === 'true'
      });
      
      const savedPost = await newPost.save();
      
      res.status(201).json(savedPost);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ message: 'Error creating post' });
    }
  },
  
  // Update a post
  updatePost: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, summary, content, category, featured, cover } = req.body;
      
      const post = await PostModel.findById(id);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Check if user is the author of the post
      if (post.author.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this post' });
      }
      
      // Update post fields
      post.title = title || post.title;
      post.summary = summary || post.summary;
      post.content = content || post.content;
      
      if (category) post.category = category;
      if (featured !== undefined) post.featured = featured === 'true';
      if (cover) {
        // If there's an existing cover and it's being replaced, delete the old one
        if (post.cover && post.cover !== cover) {
          await fileService.deleteFile(post.cover);
        }
        post.cover = cover;
      }
      
      post.updatedAt = Date.now();
      
      const updatedPost = await post.save();
      
      res.json(updatedPost);
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ message: 'Error updating post' });
    }
  },
  
  // Delete a post
  deletePost: async (req, res) => {
    const { id } = req.params;
    
    try {
      const post = await PostModel.findById(id);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Check if user is the author of the post
      if (post.author.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this post' });
      }
      
      // Delete the cover image if it exists
      if (post.cover) {
        try {
          await fileService.deleteFile(post.cover);
        } catch (error) {
          console.error('Error deleting file:', error);
          // Continue with post deletion even if file deletion fails
        }
      }
      
      // Delete all comments associated with the post
      await CommentModel.deleteMany({ post: id });
      
      // Delete the post
      await PostModel.findByIdAndDelete(id);
      
      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ message: 'Error deleting post' });
    }
  },
  
  // Like a post
  likePost: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    try {
      const post = await PostModel.findById(id);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      const likeIndex = post.likes.indexOf(userId);
      const dislikeIndex = post.dislikes.indexOf(userId);
      
      if (likeIndex > -1) {
        // User already liked, remove the like
        post.likes.splice(likeIndex, 1);
      } else {
        // User hasn't liked yet, add the like
        post.likes.push(userId);
        
        // If user had disliked, remove the dislike
        if (dislikeIndex > -1) {
          post.dislikes.splice(dislikeIndex, 1);
        }
      }
      
      await post.save();
      
      res.json({ likes: post.likes, dislikes: post.dislikes });
    } catch (error) {
      console.error('Error liking post:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  // Dislike a post
  dislikePost: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    try {
      const post = await PostModel.findById(id);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      const likeIndex = post.likes.indexOf(userId);
      const dislikeIndex = post.dislikes.indexOf(userId);
      
      if (dislikeIndex > -1) {
        // User already disliked, remove the dislike
        post.dislikes.splice(dislikeIndex, 1);
      } else {
        // User hasn't disliked yet, add the dislike
        post.dislikes.push(userId);
        
        // If user had liked, remove the like
        if (likeIndex > -1) {
          post.likes.splice(likeIndex, 1);
        }
      }
      
      await post.save();
      
      res.json({ likes: post.likes, dislikes: post.dislikes });
    } catch (error) {
      console.error('Error disliking post:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};