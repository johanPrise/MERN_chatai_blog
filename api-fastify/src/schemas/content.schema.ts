import { FastifySchema } from 'fastify';
import { ContentType } from '../types/content.types.js';

/**
 * Schéma pour la validation de la récupération de tout le contenu
 */
export const getContentsSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: Object.values(ContentType) },
      isActive: { type: 'boolean' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        contents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              title: { type: 'string' },
              slug: { type: 'string' },
              type: { type: 'string' },
              position: { type: 'number' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  },
};

/**
 * Schéma pour la validation de la récupération d'un contenu par slug
 */
export const getContentSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['slug'],
    properties: {
      slug: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        content: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            slug: { type: 'string' },
            content: { type: 'string' },
            type: { type: 'string' },
            position: { type: 'number' },
            isActive: { type: 'boolean' },
            metadata: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};

/**
 * Schéma pour la validation de la création d'un contenu
 */
export const createContentSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['title', 'content', 'type'],
    properties: {
      title: { type: 'string', minLength: 2, maxLength: 200 },
      content: { type: 'string' },
      type: { type: 'string', enum: Object.values(ContentType) },
      slug: { type: 'string' },
      position: { type: 'number' },
      isActive: { type: 'boolean' },
      metadata: { type: 'object' },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        content: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            slug: { type: 'string' },
          },
        },
      },
    },
    400: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};

/**
 * Schéma pour la validation de la mise à jour d'un contenu
 */
export const updateContentSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 2, maxLength: 200 },
      content: { type: 'string' },
      type: { type: 'string', enum: Object.values(ContentType) },
      slug: { type: 'string' },
      position: { type: 'number' },
      isActive: { type: 'boolean' },
      metadata: { type: 'object' },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        content: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            slug: { type: 'string' },
          },
        },
      },
    },
    400: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};

/**
 * Schéma pour la validation de la suppression d'un contenu
 */
export const deleteContentSchema: FastifySchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
    404: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
};
