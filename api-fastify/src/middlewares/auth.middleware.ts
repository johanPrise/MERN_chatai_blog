import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '../types/user.types.js';
import { cache } from '../services/cache.service.js';

const extractRawToken = (request: FastifyRequest): string | undefined =>
  request.cookies?.token ?? request.headers.authorization?.replace(/^Bearer\s+/i, '');

const isBlacklisted = async (request: FastifyRequest): Promise<boolean> => {
  const token = extractRawToken(request);
  if (!token) return false;
  return (await cache.get<number>(`blacklist:${token}`)) !== null;
};

const rejectUnauthorized = (reply: FastifyReply) =>
  reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
    if (await isBlacklisted(request)) {
      return rejectUnauthorized(reply);
    }
  } catch {
    rejectUnauthorized(reply);
  }
};

export const isAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
    if (await isBlacklisted(request)) {
      return rejectUnauthorized(reply);
    }
    if (!request.user || request.user.role !== UserRole.ADMIN) {
      return reply.status(403).send({ message: 'Accès refusé - Droits d\'administrateur requis' });
    }
  } catch {
    rejectUnauthorized(reply);
  }
};

export const isEditorOrAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
    if (await isBlacklisted(request)) {
      return rejectUnauthorized(reply);
    }
    const role = request.user?.role;
    if (role !== UserRole.EDITOR && role !== UserRole.ADMIN) {
      return reply.status(403).send({ message: 'Accès refusé - Droits d\'éditeur ou d\'administrateur requis' });
    }
  } catch {
    rejectUnauthorized(reply);
  }
};

export const isAuthorEditorOrAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
    if (await isBlacklisted(request)) {
      return rejectUnauthorized(reply);
    }
    const role = request.user?.role;
    const allowed = [UserRole.AUTHOR, UserRole.EDITOR, UserRole.ADMIN] as string[];
    if (!role || !allowed.includes(role)) {
      return reply.status(403).send({ message: 'Accès refusé - Droits d\'auteur, d\'éditeur ou d\'administrateur requis' });
    }
  } catch {
    rejectUnauthorized(reply);
  }
};

export const authMiddleware = authenticate;

export const optionalAuthMiddleware = async (request: FastifyRequest, _reply: FastifyReply) => {
  try {
    await request.jwtVerify();
    if (await isBlacklisted(request)) {
      request.user = undefined as never;
    }
  } catch {
    // optionnel : pas d'erreur si non authentifié
  }
};
