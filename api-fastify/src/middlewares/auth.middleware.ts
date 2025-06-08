import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/user.model.js';
import { UserRole } from '../types/user.types.js';

/**
 * Middleware pour vérifier si l'utilisateur est authentifié
 */
export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Afficher les cookies pour le débogage
    console.log('Cookies reçus:', request.cookies);
    console.log('Headers reçus:', request.headers);

    // Vérifier si le token est présent dans les cookies
    if (request.cookies.token) {
      console.log('Token trouvé dans les cookies');
    } else {
      console.log('Aucun token trouvé dans les cookies');
    }

    // Vérifier si le token est présent dans l'en-tête Authorization
    if (request.headers.authorization) {
      console.log('Token trouvé dans l\'en-tête Authorization');
    } else {
      console.log('Aucun token trouvé dans l\'en-tête Authorization');
    }

    // Vérifier le token JWT
    await request.jwtVerify();

    // Si la vérification réussit, afficher l'utilisateur authentifié
    console.log('Utilisateur authentifié:', request.user);
  } catch (error) {
    console.error('Erreur d\'authentification:', error);

    // Fournir des informations plus détaillées sur l'erreur
    if (error instanceof Error) {
      console.error('Type d\'erreur:', error.name);
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
    }

    reply.status(401).send({
      message: 'Non autorisé - Veuillez vous connecter',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
};

/**
 * Middleware pour vérifier si l'utilisateur est un administrateur
 */
export const isAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Vérifier le token JWT
    await request.jwtVerify();

    // Récupérer l'utilisateur à partir de la base de données
    const user = await User.findById(request.user._id);

    // Vérifier si l'utilisateur existe et est un administrateur
    if (!user || user.role !== UserRole.ADMIN) {
      return reply.status(403).send({ message: 'Accès refusé - Droits d\'administrateur requis' });
    }
  } catch (error) {
    reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
  }
};

/**
 * Middleware pour vérifier si l'utilisateur est un éditeur ou un administrateur
 */
export const isEditorOrAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Vérifier le token JWT
    await request.jwtVerify();

    // Récupérer l'utilisateur à partir de la base de données
    const user = await User.findById(request.user._id);

    // Vérifier si l'utilisateur existe et est un éditeur ou un administrateur
    if (!user || (user.role !== UserRole.EDITOR && user.role !== UserRole.ADMIN)) {
      return reply.status(403).send({ message: 'Accès refusé - Droits d\'éditeur ou d\'administrateur requis' });
    }
  } catch (error) {
    reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
  }
};

/**
 * Middleware pour vérifier si l'utilisateur est un auteur, un éditeur ou un administrateur
 */
export const isAuthorEditorOrAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Vérifier le token JWT
    await request.jwtVerify();

    // Récupérer l'utilisateur à partir de la base de données
    const user = await User.findById(request.user._id);

    // Vérifier si l'utilisateur existe et a un rôle approprié
    if (!user || (user.role !== UserRole.AUTHOR && user.role !== UserRole.EDITOR && user.role !== UserRole.ADMIN)) {
      return reply.status(403).send({ message: 'Accès refusé - Droits d\'auteur, d\'éditeur ou d\'administrateur requis' });
    }
  } catch (error) {
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
export const optionalAuthMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Essayer de vérifier le token JWT
    await request.jwtVerify();
  } catch (error) {
    // Si la vérification échoue, continuer sans utilisateur authentifié
    // Ne pas renvoyer d'erreur, juste continuer
  }
};
