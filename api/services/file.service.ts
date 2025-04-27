import fs from 'fs';
import path from 'path';
import { put, del } from '@vercel/blob';
import { fileURLToPath } from 'url';
import { UploadedFile } from '../types/UploadedFile';


const isProduction = process.env.NODE_ENV === 'production';

/**
 * Obtient le chemin du fichier en fonction de l'environnement
 * @param importMetaUrl - URL du module
 * @returns Chemin du fichier
 */
function getFilePath(importMetaUrl: string): string {
  if (process.env.VERCEL) {
    return './';
  } else {
    return path.dirname(fileURLToPath(importMetaUrl));
  }
}

const __filename = getFilePath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Service pour la gestion des fichiers
 */
export const fileService = {
  /**
   * Upload un fichier
   * @param file - Fichier à uploader
   * @returns URL du fichier uploadé
   */
  uploadFile: async (file: UploadedFile): Promise<string> => {
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

  /**
   * Supprime un fichier
   * @param fileUrl - URL du fichier à supprimer
   * @returns true si la suppression a réussi, false sinon
   */
  deleteFile: async (fileUrl: string): Promise<boolean> => {
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

  /**
   * Upload un fichier encodé en base64
   * @param filename - Nom du fichier
   * @param data - Données du fichier encodées en base64
   * @returns URL du fichier uploadé
   */
  uploadBase64File: async (filename: string, data: string): Promise<string> => {
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