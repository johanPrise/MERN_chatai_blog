/**
 * Interface pour représenter un fichier uploadé
 */
export interface UploadedFile {
    originalname: string;
    buffer: Buffer;
    mimetype?: string;
    size?: number;
  }