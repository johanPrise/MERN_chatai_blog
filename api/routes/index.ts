import healthRoutes from './health.js';
import authUserRoutes from './auth-user.routes.js';
import contentRoutes from './content.routes.js';
import aiRoutes from './ai.routes.js';
import uploadRoutes from './upload.routes.js';
import { Express, Request, Response } from 'express';

/**
 * Configure toutes les routes de l'API
 */
const configureRoutes = (app: Express) => {
  // Route de health check
  healthRoutes(app);

  // Basic root route
  app.get('/', (_req: Request, res: Response) => {
    res.send("API is running");
  });

  // Configure all route modules
  authUserRoutes(app);
  contentRoutes(app);
  aiRoutes(app);
  uploadRoutes(app);

  // Route par défaut pour les requêtes non gérées
  app.use('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ message: 'Endpoint non trouvé' });
  });
};

export default configureRoutes;
