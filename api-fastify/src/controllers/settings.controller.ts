import { FastifyRequest, FastifyReply } from 'fastify';
import Settings from '../models/settings.model.js';

// GET /api/settings
export const getSettings = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    reply.send(settings);
  } catch (err) {
    reply.status(500).send({ message: 'Erreur lors de la récupération des paramètres', error: err });
  }
};

// PUT /api/settings
export const updateSettings = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    Object.assign(settings, req.body);
    await settings.save();
    reply.send(settings);
  } catch (err) {
    reply.status(500).send({ message: 'Erreur lors de la mise à jour des paramètres', error: err });
  }
};
