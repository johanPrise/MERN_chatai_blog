import healthRoutes from './health';
import authUserRoutes from './auth-user.routes';
import contentRoutes from './content.routes';
import aiRoutes from './ai.routes';
import uploadRoutes from './upload.routes';

/**
 * Configure toutes les routes de l'API
 */
const configureRoutes = (app: any) => {
  // Route de health check
  healthRoutes(app);

  // Basic root route
  app.get('/', (_req: any, res: any) => {
    res.send("API is running");
  });

  // Configure all route modules
  authUserRoutes(app);
  contentRoutes(app);
  aiRoutes(app);
  uploadRoutes(app);

  // Route par défaut pour les requêtes non gérées
  app.use('/api/*', (_req: any, res: any) => {
    res.status(404).json({ message: 'Endpoint non trouvé' });
  });
};

export default configureRoutes;
