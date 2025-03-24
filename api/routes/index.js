import healthRoutes from './health.js';
import authRoutes from './auth.routes.js';
import postRoutes from './post.routes.js';
import commentRoutes from './comment.routes.js';
import categoryRoutes from './category.routes.js';
import userRoutes from './user.routes.js';
import aiRoutes from './ai.routes.js';
import uploadRoutes from './upload.routes.js';

/**
 * Configure toutes les routes de l'API
 * @param {Express} app - L'application Express
 */
const configureRoutes = (app) => {
  // Route de health check
  app.use('/api/health', healthRoutes);
  
  // Basic root route
  app.get('/', (req, res) => {
    res.send("API is running");
  });

  // Configure all route modules
  authRoutes(app);
  postRoutes(app);
  commentRoutes(app);
  categoryRoutes(app);
  userRoutes(app);
  aiRoutes(app);
  uploadRoutes(app);
  
  // Route par défaut pour les requêtes non gérées
  app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'Endpoint non trouvé' });
  });
};

export default configureRoutes;
