import { beforeAll, afterAll, afterEach } from 'vitest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern_blog_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

// Connect to test database before all tests
beforeAll(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to test database');
  } catch (error) {
    console.error('Failed to connect to test database:', error);
  }
});

// Clean up database after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

// Disconnect from database after all tests
afterAll(async () => {
  try {
    await mongoose.connection.close();
    console.log('Disconnected from test database');
  } catch (error) {
    console.error('Failed to disconnect from test database:', error);
  }
});
