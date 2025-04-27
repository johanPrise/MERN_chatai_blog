import cors from 'cors';
import { Express, Request, Response, NextFunction } from 'express';

const configureCors = (app: Express) => {
  const allowedOrigins = [
    'https://iwomi-blog.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://mern-chatai-blog.vercel.app', // Add your Vercel frontend domain
    'https://mern-chatai-blog-git-main.vercel.app', // Add potential preview URL
    'https://mern-chatai-blog-*.vercel.app', // Add wildcard for deployment previews
    'https://mern-backend-neon.vercel.app' // Backend URL if needed for same-origin requests
  ];

  // Handle OPTIONS requests globally
  app.options('*', cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowlist or matches pattern
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        // Handle exact matches
        if (allowedOrigin === origin) return true;
        
        // Handle wildcard matches
        if (allowedOrigin.includes('*')) {
          const pattern = new RegExp(allowedOrigin.replace('*', '.*'));
          return pattern.test(origin);
        }
        
        return false;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.log(`CORS blocked request from: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some(allowedOrigin => 
        allowedOrigin === origin || 
        (allowedOrigin.includes('*') && new RegExp(allowedOrigin.replace('*', '.*')).test(origin))
      )) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Set-Cookie'],
    exposedHeaders: ['Set-Cookie', 'Authorization']
  }));
};

export default configureCors;
