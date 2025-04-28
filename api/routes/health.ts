import mongoose from 'mongoose';

/**
 * Routes pour la vérification de l'état de l'API
 * Cette approche permet de réduire le nombre de fichiers de routes,
 * ce qui est important pour rester sous la limite des 12 fonctions serverless de Vercel Hobby
 */
const healthRoutes = (app: any) => {
  /**
   * @route GET /health
   * @desc Vérifier l'état de l'API et de la connexion à la base de données
   * @access Public
   */
  app.get('/health', (_req: any, res: any) => {
    const status = {
      status: 'OK',
      timestamp: new Date(),
      uptime: process.uptime(),
      database: {
        connected: mongoose.connection.readyState === 1, // 1 = connected
        state: getConnectionState(mongoose.connection.readyState),
      },
      environment: process.env.NODE_ENV || 'development'
    };

    return res.status(200).json(status);
  });
};

/**
 * Fonction utilitaire pour obtenir l'état de la connexion à la base de données
 */
function getConnectionState(state: number): string {
  switch (state) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    default: return 'unknown';
  }
}

export default healthRoutes;
