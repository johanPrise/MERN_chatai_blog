import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Request, Response } from 'express';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to uploads directory (assuming it's at the same level as controllers)
const uploadsDirectory = path.join(__dirname, '..', 'uploads');

/**
 * Controller for handling file uploads and deletions
 */
export const uploadController = {
  /**
   * Upload a file using multer middleware
   * @param {Object} req - Express request object (with file from multer)
   * @param {Object} res - Express response object
   */
  uploadFile: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      // Return the file information
      return res.status(200).json({
        success: true,
        file: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          path: `/uploads/${req.file.filename}`,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to upload file', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  },

  /**
   * Upload a base64 encoded file
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  uploadBase64File: async (req: Request, res: Response) => {
    try {
      const { base64Data, filename, mimetype } = req.body;

      if (!base64Data || !filename) {
        return res.status(400).json({ success: false, message: 'Base64 data and filename are required' });
      }

      // Extract the base64 content (remove data:image/jpeg;base64, part if present)
      const base64Content = base64Data.includes('base64,') 
        ? base64Data.split('base64,')[1] 
        : base64Data;

      // Generate a unique filename
      const timestamp = Date.now();
      const fileExtension = path.extname(filename);
      const baseFilename = path.basename(filename, fileExtension);
      const uniqueFilename = `${baseFilename}_${timestamp}${fileExtension}`;
      
      // Create file path
      const filePath = path.join(uploadsDirectory, uniqueFilename);
      
      // Write file to disk
      fs.writeFileSync(filePath, Buffer.from(base64Content, 'base64'));

      return res.status(200).json({
        success: true,
        file: {
          filename: uniqueFilename,
          originalname: filename,
          path: `/uploads/${uniqueFilename}`,
          mimetype: mimetype || 'application/octet-stream',
        }
      });
    } catch (error) {
      console.error('Error uploading base64 file:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to upload base64 file', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  },

  /**
   * Delete a file by filename
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteFile: async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        return res.status(400).json({ success: false, message: 'Filename is required' });
      }

      const filePath = path.join(uploadsDirectory, filename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File not found' });
      }

      // Delete the file
      fs.unlinkSync(filePath);

      return res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete file', 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }
};