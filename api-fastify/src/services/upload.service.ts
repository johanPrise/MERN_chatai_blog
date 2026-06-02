import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { nanoid } from 'nanoid';
import { MultipartFile } from '@fastify/multipart';
import { imageService } from './image.service.js';

// Convertir les fonctions fs en promesses
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

// Dossier de destination pour les uploads
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const isAllowedImageMimeType = (mimeType: string): boolean => {
  return ALLOWED_IMAGE_MIME_TYPES.has(mimeType.toLowerCase());
};

const parseBase64Image = (base64Data: string): { mimeType: string; buffer: Buffer } => {
  const matches = base64Data.match(/^data:([A-Za-z0-9.+-]+\/[A-Za-z0-9.+-]+);base64,(.+)$/);

  if (matches?.length !== 3) {
    throw new Error('Format d\'image base64 invalide');
  }

  const mimeType = matches[1].toLowerCase();
  if (!isAllowedImageMimeType(mimeType)) {
    throw new Error('Format d\'image non autorisé');
  }

  return {
    mimeType,
    buffer: Buffer.from(matches[2], 'base64'),
  };
};

const validateImageBuffer = async (buffer: Buffer): Promise<'jpg' | 'png' | 'webp'> => {
  try {
    return await imageService.validateImage(buffer);
  } catch {
    throw new Error('Image invalide ou non autorisée');
  }
};

/**
 * Crée le dossier d'uploads s'il n'existe pas
 */
const ensureUploadDir = async (): Promise<void> => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }
  } catch (error) {
    throw new Error('Impossible de créer le dossier d\'uploads');
  }
};

/**
 * Sauvegarde un fichier uploadé sur le disque
 */
export const saveFile = async (file: MultipartFile): Promise<string> => {
  await ensureUploadDir();

  // Générer un nom de fichier unique
  const fileExtension = path.extname(file.filename);
  const fileName = `${nanoid(10)}${fileExtension}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  // Lire le contenu du fichier
  const buffer = await file.toBuffer();

  // Écrire le fichier sur le disque
  await writeFile(filePath, buffer);

  // Retourner le chemin relatif du fichier
  return `/uploads/${fileName}`;
};

export interface SavedImage {
  url: string;
  optimizedUrl: string;
  thumbnailUrl: string;
}

/**
 * Sauvegarde un fichier image et génère des dérivés (optimisé + miniature)
 */
export const saveImageFile = async (file: MultipartFile): Promise<SavedImage> => {
  await ensureUploadDir();

  if (!isAllowedImageMimeType(file.mimetype)) {
    throw new Error('Format d\'image non autorisé');
  }

  const baseName = nanoid(10);
  const buffer = await file.toBuffer();
  const ext = await validateImageBuffer(buffer);
  const fileName = `${baseName}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  await writeFile(filePath, buffer);

  // Générer les dérivés
  const optimizedName = await imageService.optimizeImage(buffer, fileName, { width: 1600, format: 'webp', quality: 82 });
  const thumbName = await imageService.createThumbnail(buffer, fileName);

  return {
    url: `/uploads/${fileName}`,
    optimizedUrl: `/uploads/${optimizedName}`,
    thumbnailUrl: `/uploads/${thumbName}`,
  };
};

/**
 * Sauvegarde une image en base64 sur le disque
 */
export const saveBase64Image = async (base64Data: string, _fileName: string): Promise<string> => {
  await ensureUploadDir();

  const { buffer } = parseBase64Image(base64Data);
  const fileExtension = await validateImageBuffer(buffer);

  // Générer un nom de fichier unique
  const uniqueFileName = `${nanoid(10)}.${fileExtension}`;
  const filePath = path.join(UPLOAD_DIR, uniqueFileName);

  // Écrire le fichier sur le disque
  await writeFile(filePath, buffer);

  // Retourner le chemin relatif du fichier
  return `/uploads/${uniqueFileName}`;
};

/**
 * Sauvegarde une image base64 et génère des dérivés (optimisé + miniature)
 */
export const saveBase64ImageDetailed = async (base64Data: string, _fileName: string): Promise<SavedImage> => {
  await ensureUploadDir();

  const { buffer } = parseBase64Image(base64Data);
  const fileExtension = await validateImageBuffer(buffer);

  const baseName = nanoid(10);
  const uniqueFileName = `${baseName}.${fileExtension}`;
  const filePath = path.join(UPLOAD_DIR, uniqueFileName);

  await writeFile(filePath, buffer);

  const optimizedName = await imageService.optimizeImage(buffer, uniqueFileName, { width: 1600, format: 'webp', quality: 82 });
  const thumbName = await imageService.createThumbnail(buffer, uniqueFileName);

  return {
    url: `/uploads/${uniqueFileName}`,
    optimizedUrl: `/uploads/${optimizedName}`,
    thumbnailUrl: `/uploads/${thumbName}`,
  };
};

/**
 * Supprime un fichier du disque
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  // Extraire le nom du fichier du chemin
  const fileName = path.basename(filePath);
  const fullPath = path.join(UPLOAD_DIR, fileName);

  // Vérifier si le fichier existe
  if (fs.existsSync(fullPath)) {
    await promisify(fs.unlink)(fullPath);
  }
};
