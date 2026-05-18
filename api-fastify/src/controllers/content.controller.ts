import { FastifyRequest, FastifyReply } from 'fastify';
import { isValidObjectId } from '../utils/index.js';
import { CreateContentInput, UpdateContentInput, ContentType } from '../types/content.types.js';
import * as ContentService from '../services/content.service.js';

/**
 * Contrôleur pour récupérer tout le contenu
 */
export const getContents = async (
  request: FastifyRequest<{
    Querystring: {
      type?: ContentType;
      isActive?: boolean;
    }
  }>,
  reply: FastifyReply
) => {
  try {
    const { type, isActive } = request.query;
    const canViewInactiveContent = request.user?.role === 'admin';
    const activeFilter = canViewInactiveContent ? isActive : true;

    // Utiliser le service pour récupérer le contenu
    const contents = await ContentService.getAllContent(type, activeFilter);

    // Retourner la réponse
    return reply.status(200).send({
      contents,
    });
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la récupération du contenu',
    });
  }
};

/**
 * Contrôleur pour récupérer un contenu par slug
 */
export const getContent = async (
  request: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply
) => {
  try {
    const { slug } = request.params;
    const userRole = request.user?.role;

    // Utiliser le service pour récupérer le contenu
    try {
      const content = await ContentService.getContentBySlug(slug, userRole);

      // Retourner la réponse
      return reply.status(200).send({
        content,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Contenu non trouvé') {
        return reply.status(404).send({
          message: 'Contenu non trouvé',
        });
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la récupération du contenu',
    });
  }
};

/**
 * Contrôleur pour créer un nouveau contenu
 */
export const createContent = async (
  request: FastifyRequest<{ Body: CreateContentInput }>,
  reply: FastifyReply
) => {
  try {
    const contentData = request.body;

    // Utiliser le service pour créer le contenu
    try {
      const result = await ContentService.createContent(contentData);

      // Retourner la réponse
      return reply.status(201).send({
        message: 'Contenu créé avec succès',
        content: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Un contenu avec ce slug existe déjà') {
        return reply.status(400).send({
          message: error.message,
        });
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la création du contenu',
    });
  }
};

const ERROR_STATUS_MAP: Record<string, number> = {
  'ID contenu invalide': 400,
  'Contenu non trouvé': 404,
  'Un contenu avec ce slug existe déjà': 400,
  'Erreur lors de la mise à jour du contenu': 500,
};

const handleContentError = (error: unknown, reply: FastifyReply): FastifyReply | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  const statusCode = ERROR_STATUS_MAP[error.message];
  if (!statusCode) {
    return null;
  }

  return reply.status(statusCode).send({ message: error.message });
};

/**
 * Contrôleur pour mettre à jour un contenu
 */
export const updateContent = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateContentInput }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const updateData = request.body;

    if (!isValidObjectId(id)) {
      return reply.status(400).send({ message: 'ID contenu invalide' });
    }

    try {
      const result = await ContentService.updateContent(id, updateData);
      return reply.status(200).send({
        message: 'Contenu mis à jour avec succès',
        content: result,
      });
    } catch (error) {
      const errorResponse = handleContentError(error, reply);
      if (errorResponse) {
        return await errorResponse;
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la mise à jour du contenu',
    });
  }
};

/**
 * Contrôleur pour supprimer un contenu
 */
export const deleteContent = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    if (!isValidObjectId(id)) {
      return reply.status(400).send({ message: 'ID contenu invalide' });
    }

    try {
      await ContentService.deleteContent(id);
      return reply.status(200).send({ message: 'Contenu supprimé avec succès' });
    } catch (error) {
      const errorResponse = handleContentError(error, reply);
      if (errorResponse) {
        return await errorResponse;
      }
      throw error;
    }
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la suppression du contenu',
    });
  }
};
