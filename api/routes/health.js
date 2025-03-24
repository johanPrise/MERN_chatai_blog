import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * @route GET /
 * @desc Vérifier l'état de l'API et de la connexion à la base de données
 * @access Public
 */
router.get('/', (req, res) => {
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

/**
 * Fonction utilitaire pour obtenir l'état de la connexion à la base de données
 */
function getConnectionState(state) {
  switch (state) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    default: return 'unknown';
  }
}

export default router;
