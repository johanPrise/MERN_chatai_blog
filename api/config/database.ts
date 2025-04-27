import mongoose from 'mongoose';
import { env } from 'node:process';
import jwt from 'jsonwebtoken';
import { Request } from 'express';

const MONGO_URI = env.VITE_MONGO_URI || env.MONGODB_URI;

/**
 * Configuration et connexion à la base de données MongoDB
 */
const connectDB = async () => {
  try {
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

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET non défini');

interface AuthRequest extends Request {
  user: { id: string };
}

export default connectDB;
