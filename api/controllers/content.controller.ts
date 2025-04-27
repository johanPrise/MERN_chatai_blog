import mongoose from 'mongoose';
import Post  from '../models/Post';
import  Comment  from '../models/Comments';
import Category from '../models/categories';
import { Request, Response } from 'express';
import { IPost } from '../types/Post';
import { IComment } from '../types/Comments';
import { ICategory } from '../types/Categories';

interface AuthRequest extends Request {
  user: { id: string };
}

export const contentController = {
  // Post methods
  getAllPosts: async (req: Request, res: Response) => {
    try {
      const { page = '1', limit = '10', category } = req.query;
      const queryOptions = category ? { category } : {};
      
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      
      const posts = await Post.find(queryOptions)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .populate('author', 'username')
        .populate('category', 'name') as IPost[];
      
      const count = await Post.countDocuments(queryOptions);
      
      res.status(200).json({
        posts,
        totalPages: Math.ceil(count / limitNum),
        currentPage: pageNum
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },
  
  getPostById: async (req: Request, res: Response) => {
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
        }) as IPost | null;
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      res.status(200).json(post);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },
  
  createPost: async (req: AuthRequest, res: Response) => {
    try {
      const { title, content, category, featuredImage } = req.body;
      
      const post: IPost = new Post({
        title,
        content,
        author: req.user.id,
        category,
        featuredImage
      });
      
      await (post as any).save();
      
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },
  
  updatePost: async (req: AuthRequest, res: Response) => {
    try {
      const { title, content, category, featuredImage } = req.body;
      
      const post = await Post.findById(req.params.id) as IPost | null;
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Check ownership
      if ((post.author as any).toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this post' });
      }
      
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { title, content, category, featuredImage },
        { new: true, runValidators: true }
      ) as IPost | null;
      
      res.status(200).json(updatedPost);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },
  
  deletePost: async (req: AuthRequest, res: Response) => {
    try {
      const post = await Post.findById(req.params.id) as IPost | null;
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // Check ownership
      if ((post.author as any).toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this post' });
      }
      
      await (post as any).deleteOne();
      
      res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },
  
  // Comment methods

  getCommentsByPost: async (req: Request, res: Response) => {
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
        .sort({ createdAt: -1 }) as IComment[];
      
      res.status(200).json(comments);
    } catch (error) {
      console.error('Error getting comments:', error);
      res.status(500).json({ message: 'Failed to get comments', error: error instanceof Error ? error.message : String(error) });
    }
  },
  
  addComment: async (req: AuthRequest, res: Response) => {
    try {
      const { content } = req.body;
      const postId = req.params.postId;
      
      const post = await Post.findById(postId) as IPost | null;
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      const comment: IComment = new Comment({
        content,
        author: req.user.id,
        post: postId
      });
      
      await (comment as any).save();
      
      // Add comment to post
      (post as any).comments.push((comment as any)._id);
      await (post as any).save();
      
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },
  
  updateComment: async (req: AuthRequest, res: Response) => {
    try {
      const { content } = req.body;
      
      const comment = await Comment.findById(req.params.commentId) as IComment | null;
      
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      // Check ownership
      if ((comment.author as any).toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to update this comment' });
      }
      
      (comment as any).content = content;
      await (comment as any).save();
      
      res.status(200).json(comment);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },
  
  deleteComment: async (req: AuthRequest, res: Response) => {
    try {
      const comment = await Comment.findById(req.params.commentId) as IComment | null;
      
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      // Check ownership
      if ((comment.author as any).toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to delete this comment' });
      }
      
      // Remove comment from post
      await Post.findByIdAndUpdate((comment as any).post, {
        $pull: { comments: (comment as any)._id }
      });
      
      await (comment as any).deleteOne();
      
      res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },
  
  // Category methods
  getAllCategories: async (req: Request, res: Response) => {
    try {
      const categories = await Category.find().sort({ name: 1 }) as ICategory[];
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },
  
  getCategoryById: async (req: Request, res: Response) => {
    try {
      const category = await Category.findById(req.params.id) as ICategory | null;
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },
  
  createCategory: async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      
      // Check if category already exists
      const categoryExists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (categoryExists) {
        return res.status(400).json({ message: 'Category already exists' });
      }
      
      const category: ICategory = new Category({
        name,
        description
      });
      
      await (category as any).save();
      
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },
  
  updateCategory: async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      
      const category = await Category.findByIdAndUpdate(
        req.params.id,
        { name, description },
        { new: true, runValidators: true }
      ) as ICategory | null;
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  },
  
  deleteCategory: async (req: Request, res: Response) => {
    try {
      const category = await Category.findById(req.params.id) as ICategory | null;
      
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
      
      await (category as any).deleteOne();
      
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
  }
};