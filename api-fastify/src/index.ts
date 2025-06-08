import { config } from 'dotenv';
import { buildServer } from './server.js';
import './models/settings.model';

// Charger les variables d'environnement
config();

// Port du serveur
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4200;

// Démarrer le serveur
const startServer = async () => {
  try {
    const server = await buildServer();

    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Serveur en écoute sur le port ${PORT}`);
  } catch (error) {
    console.error('Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

// Gérer les erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Démarrer le serveur
startServer();
