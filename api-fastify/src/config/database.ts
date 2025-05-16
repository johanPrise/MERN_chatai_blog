import mongoose from 'mongoose';

/**
 * Configuration et connexion à la base de données MongoDB
 */
export const connectDB = async (): Promise<void> => {
  try {
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern_blog';
    
    if (!MONGO_URI) {
      throw new Error('URI MongoDB non définie dans les variables d\'environnement');
    }
    
    await mongoose.connect(MONGO_URI);
    
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
};
