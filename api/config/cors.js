import cors from 'cors';

const configureCors = (app) => {
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

  // Main CORS middleware
  app.use(cors({
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Set-Cookie']
  }));

  // Manual headers
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Only set Access-Control-Allow-Origin if origin is allowed
    if (origin && allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin === origin) return true;
      if (allowedOrigin.includes('*')) {
        const pattern = new RegExp(allowedOrigin.replace('*', '.*'));
        return pattern.test(origin);
      }
      return false;
    })) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      res.header('Access-Control-Allow-Origin', '*');
    }
    
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Set-Cookie, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Set-Cookie');
    
    // Special handling for OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });
};

export default configureCors;
