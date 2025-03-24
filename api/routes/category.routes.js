import { categoryController } from '../controllers/category.controller.js';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.js';

const categoryRoutes = (app) => {
  // Get all categories
  app.get('/category', categoryController.getAllCategories);
  
  // Get a category by ID
  app.get('/category/:categoryId', categoryController.getCategoryById);
  
  // Create a new category (admin only)
  app.post('/category', authMiddleware, adminMiddleware, categoryController.createCategory);
  
  // Update a category (admin only)
  app.put('/category/:categoryId', authMiddleware, adminMiddleware, categoryController.updateCategory);
  
  // Delete a category (admin only)
  app.delete('/categories/:categoryId', authMiddleware, adminMiddleware, categoryController.deleteCategory);
};

export default categoryRoutes;