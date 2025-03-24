import CategoryModel from '../models/categories.js';

export const categoryController = {
  // Get all categories
  getAllCategories: async (req, res) => {
    try {
      const categories = await CategoryModel.find();
      res.json(categories);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  // Get a category by ID
  getCategoryById: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const category = await CategoryModel.findById(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  // Create a new category
  createCategory: async (req, res) => {
    try {
      const { name, description } = req.body;
      
      // Check if category already exists
      const existingCategory = await CategoryModel.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category already exists' });
      }
      
      const categoryDoc = await CategoryModel.create({
        name,
        description,
      });
      
      res.json(categoryDoc);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  // Update a category
  updateCategory: async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { name, description } = req.body;
      
      const category = await CategoryModel.findById(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      // Check if new name already exists (if name is being changed)
      if (name !== category.name) {
        const existingCategory = await CategoryModel.findOne({ name });
        if (existingCategory) {
          return res.status(400).json({ message: 'Category name already exists' });
        }
      }
      
      category.name = name || category.name;
      category.description = description || category.description;
      
      await category.save();
      
      res.json(category);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  },
  
  // Delete a category
  deleteCategory: async (req, res) => {
    try {
      const { categoryId } = req.params;
      
      const category = await CategoryModel.findByIdAndDelete(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json({ message: 'Category deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
};