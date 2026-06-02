import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '../types/user.types.js';

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch (error) {
    reply.status(401).send({
      message: 'Non autorisé - Veuillez vous connecter',
    });
  }
};

export const isAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
    if (!request.user || request.user.role !== UserRole.ADMIN) {
      return reply.status(403).send({ message: 'Accès refusé - Droits d\'administrateur requis' });
    }
  } catch {
    reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
  }
};

export const isEditorOrAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
    const role = request.user?.role;
    if (role !== UserRole.EDITOR && role !== UserRole.ADMIN) {
      return reply.status(403).send({ message: 'Accès refusé - Droits d\'éditeur ou d\'administrateur requis' });
    }
  } catch {
    reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
  }
};

export const isAuthorEditorOrAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
    const role = request.user?.role;
    const allowed = [UserRole.AUTHOR, UserRole.EDITOR, UserRole.ADMIN] as string[];
    if (!role || !allowed.includes(role)) {
      return reply.status(403).send({ message: 'Accès refusé - Droits d\'auteur, d\'éditeur ou d\'administrateur requis' });
    }
  } catch {
    reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
  }
};

/**
 * Middleware d'authentification obligatoire
 */
export const authMiddleware = authenticate;

/**
 * Middleware d'authentification optionnelle
 * N'interrompt pas la requête si l'utilisateur n'est pas authentifié
 */
export const optionalAuthMiddleware = async (request: FastifyRequest, _reply: FastifyReply) => {
  try {
    // Essayer de vérifier le token JWT
    await request.jwtVerify();
  } catch (error) {
    // Si la vérification échoue, continuer sans utilisateur authentifié
    // Ne pas renvoyer d'erreur, juste continuer
  }
};
