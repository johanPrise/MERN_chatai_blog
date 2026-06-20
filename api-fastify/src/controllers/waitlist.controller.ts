import { FastifyRequest, FastifyReply } from 'fastify';
import { JoinWaitlistInput } from '../types/waitlist.types.js';
import * as WaitlistService from '../services/waitlist.service.js';

/**
 * Contrôleur pour rejoindre la liste d'attente d'une fonctionnalité à venir
 */
export const joinWaitlist = async (
  request: FastifyRequest<{ Body: JoinWaitlistInput }>,
  reply: FastifyReply
) => {
  try {
    const { alreadyRegistered } = await WaitlistService.joinWaitlist(request.body);

    return reply.status(200).send({
      message: alreadyRegistered
        ? 'Vous êtes déjà inscrit. Nous vous préviendrons dès que ce sera prêt !'
        : 'Merci ! Nous vous préviendrons dès que ce sera disponible.',
      alreadyRegistered,
    });
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de l\'inscription à la liste d\'attente',
    });
  }
};
