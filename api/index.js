import dotenv from 'dotenv';
import { app } from './config/app.js';
import connectDB from './config/database.js';
import configureCors from './config/cors.js';
import configureRoutes from './routes/index.js';

// Load environment variables
dotenv.config();

// Server configuration
const PORT = process.env.PORT || 4200;

// Configure CORS
configureCors(app);

// Configure routes
configureRoutes(app);

// Database connection and server startup
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Serveur en écoute sur le port ${PORT}`);
    });
  } catch (error) {
    console.error('Erreur au démarrage du serveur:', error.message);
    process.exit(1);
  }
};

// Start the server if not in production (for Vercel)
if (process.env.NODE_ENV !== 'production') {
  startServer();
}

export default app;
