import { FastifySchema } from 'fastify';

/**
 * Schéma de validation pour rejoindre la liste d'attente
 */
export const joinWaitlistSchema: FastifySchema = {
  body: {
    type: 'object',
    required: ['email'],
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email', maxLength: 254 },
      source: { type: 'string', maxLength: 50 },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        alreadyRegistered: { type: 'boolean' },
      },
    },
  },
};
