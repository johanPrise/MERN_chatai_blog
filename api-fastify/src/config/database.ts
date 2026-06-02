import mongoose from 'mongoose';
import { logger } from '../services/logger.service.js';

export const connectDB = async (): Promise<void> => {
  try {
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern_blog';
    await mongoose.connect(MONGO_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error', error instanceof Error ? error : undefined);
    process.exit(1);
  }
};
