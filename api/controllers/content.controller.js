import Post  from '../models/Post.js';
import  Comment  from '../models/Comments.js';
import Category from '../models/categories.js';

export const contentController = {
  // Post methods
  getAllPosts: async (req, res) => {
    try {
      const { page = 1, limit = 10, category } = req.query;
      const queryOptions = category ? { category } : {};
      
      const posts = await Post.find(queryOptions)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('author', 'username')
        .populate('category', 'name');
      
      const count = await Post.countDocuments(queryOptions);
      
      res.status(200).json({
        posts,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  getPostById: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id)
        .populate('author', 'username')
        .populate('category', 'name')
        .populate({
          path: 'comments',
          populate: {
            path: 'author',
            select: 'username'
          }
        });
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  createPost: async (req, res) => {
    try {
      const { title, content, category, featuredImage } = req.body;
      
      const post = new Post({
        title,
        content,
        author: req.user.id,
        category,
        featuredImage
      });
      
      await post.save();
      
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  updatePost: async (req, res) => {
    try {
      const { title, content, category, featuredImage } = req.body;
      
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Check ownership
      if (post.author.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this post' });
      }
      
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { title, content, category, featuredImage },
        { new: true, runValidators: true }
      );
      
      res.status(200).json(updatedPost);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  deletePost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Check ownership
      if (post.author.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this post' });
      }
      
      await post.remove();
      
      res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  // Comment methods

  getCommentsByPost: async (req, res) => {
    try {
      const { postId } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({ message: 'Invalid post ID' });
      }
      
      // Vérifier si le post existe
      const postExists = await Post.exists({ _id: postId });
      if (!postExists) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      const comments = await Comment.find({ post: postId })
        .populate('author', 'username email')
        .sort({ createdAt: -1 });
      
      res.status(200).json(comments);
    } catch (error) {
      console.error('Error getting comments:', error);
      res.status(500).json({ message: 'Failed to get comments', error: error.message });
    }
  },
  
  addComment: async (req, res) => {
    try {
      const { content } = req.body;
      const postId = req.params.postId;
      
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      const comment = new Comment({
        content,
        author: req.user.id,
        post: postId
      });
      
      await comment.save();
      
      // Add comment to post
      post.comments.push(comment._id);
      await post.save();
      
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  updateComment: async (req, res) => {
    try {
      const { content } = req.body;
      
      const comment = await Comment.findById(req.params.commentId);
      
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      // Check ownership
      if (comment.author.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this comment' });
      }
      
      comment.content = content;
      await comment.save();
      
      res.status(200).json(comment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  deleteComment: async (req, res) => {
    try {
      const comment = await Comment.findById(req.params.commentId);
      
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      // Check ownership
      if (comment.author.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this comment' });
      }
      
      // Remove comment from post
      await Post.findByIdAndUpdate(comment.post, {
        $pull: { comments: comment._id }
      });
      
      await comment.remove();
      
      res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  // Category methods
  getAllCategories: async (req, res) => {
    try {
      const categories = await Category.find().sort({ name: 1 });
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  getCategoryById: async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  createCategory: async (req, res) => {
    try {
      const { name, description } = req.body;
      
      // Check if category already exists
      const categoryExists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (categoryExists) {
        return res.status(400).json({ message: 'Category already exists' });
      }
      
      const category = new Category({
        name,
        description
      });
      
      await category.save();
      
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  updateCategory: async (req, res) => {
    try {
      const { name, description } = req.body;
      
      const category = await Category.findByIdAndUpdate(
        req.params.id,
        { name, description },
        { new: true, runValidators: true }
      );
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  deleteCategory: async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Check if category is used in any posts
      const postsWithCategory = await Post.countDocuments({ category: req.params.id });
      if (postsWithCategory > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete category that is used in posts',
          postsCount: postsWithCategory
        });
      }
      
      await category.remove();
      
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};