import fs from 'fs';
import path from 'path';
import { put, del } from '@vercel/blob';
import { fileURLToPath } from 'url';

const isProduction = process.env.NODE_ENV === 'production';

function getFilePath(importMetaUrl) {
  if (process.env.VERCEL) {
    return './';
  } else {
    return path.dirname(fileURLToPath(importMetaUrl));
  }
}

const __filename = getFilePath(import.meta.url);
const __dirname = path.dirname(__filename);

export const fileService = {
  // Upload a file
  uploadFile: async (file) => {
    try {
      const uniqueFileName = `${Date.now()}-${file.originalname}`;
      
      if (isProduction) {
        const blob = await put(`uploads/${uniqueFileName}`, file.buffer, {
          access: 'public',
        });
        return blob.url;
      } else {
        const filePath = path.join(__dirname, '../../uploads', uniqueFileName);
        await fs.promises.writeFile(filePath, file.buffer);
        return `/uploads/${uniqueFileName}`;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('File upload failed');
    }
  },
  
  // Delete a file
  deleteFile: async (fileUrl) => {
    try {
      if (isProduction) {
        await del(fileUrl);
      } else {
        const filePath = path.join(__dirname, '../..', fileUrl);
        await fs.promises.unlink(filePath);
      }
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  },
  
  // Upload a base64 file
  uploadBase64File: async (filename, data) => {
    try {
      // Convert base64 string to Buffer
      const buffer = Buffer.from(data, 'base64');
      
      // Generate unique filename
      const uniqueFilename = `${Date.now()}-${filename}`;
      
      if (isProduction) {
        const blob = await put(`uploads/${uniqueFilename}`, buffer, {
          access: 'public',
        });
        return blob.url;
      } else {
        const filePath = path.join(__dirname, '../../uploads', uniqueFilename);
        await fs.promises.writeFile(filePath, buffer);
        return `/uploads/${uniqueFilename}`;
      }
    } catch (error) {
      console.error('Error uploading base64 file:', error);
      throw new Error('File upload failed');
    }
  }
};