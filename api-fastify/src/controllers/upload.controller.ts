import { FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import * as UploadService from '../services/upload.service.js';

/**
 * Interface pour la requête d'upload de fichier
 * Note: FastifyRequest avec le plugin multipart ajoute la méthode file()
 */
interface FileUploadRequest extends FastifyRequest {
  file(): Promise<MultipartFile | undefined>;
}

/**
 * Interface pour la requête d'upload d'image en base64
 */
interface Base64UploadRequest extends FastifyRequest<{
  Body: {
    filename: string;
    data: string;
  }
}> {}

/**
 * Contrôleur pour l'upload de fichier
 */
export const uploadFile = async (request: FileUploadRequest, reply: FastifyReply) => {
  try {
    // Récupérer le fichier
    const file = await request.file();

    if (!file) {
      return reply.status(400).send({
        message: 'Aucun fichier fourni',
      });
    }

    // Vérifier le type MIME
    const mimeType = file.mimetype;
    if (!mimeType.startsWith('image/')) {
      return reply.status(400).send({
        message: 'Seules les images sont autorisées',
      });
    }

    // Sauvegarder le fichier
    const filePath = await UploadService.saveFile(file);

    // Construire l'URL complète
    const baseUrl = `${request.protocol}://${request.hostname}`;
    const fileUrl = `${baseUrl}${filePath}`;

    // Retourner la réponse
    return reply.status(200).send({
      message: 'Fichier uploadé avec succès',
      url: fileUrl,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de l\'upload du fichier',
    });
  }
};

/**
 * Contrôleur pour l'upload d'image en base64
 */
export const uploadBase64Image = async (request: Base64UploadRequest, reply: FastifyReply) => {
  try {
    const { filename, data } = request.body;

    if (!data) {
      return reply.status(400).send({
        message: 'Aucune donnée d\'image fournie',
      });
    }

    // Vérifier que les données sont au format base64
    if (!data.startsWith('data:image/')) {
      return reply.status(400).send({
        message: 'Format d\'image invalide. Doit être une image en base64 avec en-tête data:image/',
      });
    }

    // Sauvegarder l'image
    const filePath = await UploadService.saveBase64Image(data, filename);

    // Construire l'URL complète
    const baseUrl = `${request.protocol}://${request.hostname}`;
    const fileUrl = `${baseUrl}${filePath}`;

    // Retourner la réponse
    return reply.status(200).send({
      message: 'Image uploadée avec succès',
      url: fileUrl,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de l\'upload de l\'image',
    });
  }
};
