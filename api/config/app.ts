import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import path from 'path';
import multer from 'multer';

// Create Express app
export const app = express();

// Configure middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());

// Configure file uploads
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limit file size to 5MB
  },
});

// Configure static file serving
const __dirname = process.cwd();

// Serve static files if not in production
const isProduction = process.env.NODE_ENV === 'production';
if (!isProduction) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Serve static images
app.use("/src/components/assets/images", express.static("images"));