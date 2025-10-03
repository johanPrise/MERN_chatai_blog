import { FastifyRequest, FastifyReply } from 'fastify';
import {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  ChangePasswordInput
} from '../types/auth.types.js';
import * as AuthService from '../services/auth.service.js';
import { UserRole } from '../types/user.types.js';

/**
 * Contrôleur pour l'inscription d'un nouvel utilisateur
 */
export const register = async (
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply
) => {
  try {
    const newUser = await AuthService.registerUser(request.body);

    // Retourner la réponse
    return reply.status(201).send({
      message: 'Inscription réussie. Veuillez vérifier votre email pour activer votre compte.',
      user: newUser,
    });
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));

    if (error instanceof Error && error.message.includes('déjà utilisé')) {
      return reply.status(400).send({
        message: error.message,
      });
    }

    return reply.status(500).send({
      message: 'Une erreur est survenue lors de l\'inscription',
    });
  }
};

/**
 * Contrôleur pour la connexion d'un utilisateur
 */
export const login = async (
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) => {
  try {
    const user = await AuthService.loginUser(request.body);

    // Générer un token JWT
    const token = reply.jwtSign(
      {
        _id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
      },
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
      }
    );
    // Attendre que le token soit généré
const jwtToken = await token;

// Définir le cookie avec le token JWT
reply.setCookie('token', jwtToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Secure en production seulement
      sameSite: 'lax', // Protection contre CSRF
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours en millisecondes
    });

    // Afficher les informations pour le débogage
    console.log('Cookie token défini avec succès');

    // Retourner la réponse
return reply.status(200).send({
  token: jwtToken,
  user,
});
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));

    if (error instanceof Error && error.message.includes('incorrect')) {
      return reply.status(401).send({
        message: error.message,
      });
    }

    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la connexion',
    });
  }
};

/**
 * Contrôleur pour la vérification de l'email
 */
export const verifyEmail = async (
  request: FastifyRequest<{ Params: VerifyEmailInput }>,
  reply: FastifyReply
) => {
  try {
    const { token } = request.params as { token: string };

    await AuthService.verifyUserEmail(token);

    // Rediriger vers la page de connexion
    return reply.status(200).send({
      message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.',
    });
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));

    if (error instanceof Error && error.message.includes('invalide')) {
      return reply.status(400).send({
        message: error.message,
      });
    }

    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la vérification de l\'email',
    });
  }
};

/**
 * Contrôleur pour la demande de réinitialisation de mot de passe
 */
export const forgotPassword = async (
  request: FastifyRequest<{ Body: ForgotPasswordInput }>,
  reply: FastifyReply
) => {
  try {
    await AuthService.requestPasswordReset(request.body);

    // Retourner la réponse (même si l'utilisateur n'existe pas, pour des raisons de sécurité)
    return reply.status(200).send({
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
    });
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la demande de réinitialisation de mot de passe',
    });
  }
};

/**
 * Contrôleur pour la réinitialisation de mot de passe
 */
export const resetPassword = async (
  request: FastifyRequest<{ Body: ResetPasswordInput }>,
  reply: FastifyReply
) => {
  try {
    await AuthService.resetUserPassword(request.body);

    // Retourner la réponse
    return reply.status(200).send({
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
    });
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));

    if (error instanceof Error && error.message.includes('invalide')) {
      return reply.status(400).send({
        message: error.message,
      });
    }

    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la réinitialisation du mot de passe',
    });
  }
};

/**
 * Contrôleur pour le changement de mot de passe
 */
export const changePassword = async (
  request: FastifyRequest<{ Body: ChangePasswordInput }>,
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
    }

    const userId = request.user._id;

    await AuthService.changeUserPassword(userId, request.body);

    // Retourner la réponse
    return reply.status(200).send({
      message: 'Mot de passe changé avec succès',
    });
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));

    if (error instanceof Error) {
      if (error.message.includes('non trouvé')) {
        return reply.status(404).send({
          message: error.message,
        });
      } else if (error.message.includes('incorrect')) {
        return reply.status(401).send({
          message: error.message,
        });
      }
    }

    return reply.status(500).send({
      message: 'Une erreur est survenue lors du changement de mot de passe',
    });
  }
};

/**
 * Contrôleur pour récupérer les informations de l'utilisateur connecté
 */
export const getMe = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
    }

    const userId = request.user._id;

    const user = await AuthService.getCurrentUser(userId);

    // Retourner la réponse
    return reply.status(200).send({
      user,
    });
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));

    if (error instanceof Error && error.message.includes('non trouvé')) {
      return reply.status(404).send({
        message: error.message,
      });
    }

    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la récupération des informations utilisateur',
    });
  }
};

/**
 * Contrôleur pour vérifier si l'utilisateur est un auteur, un éditeur ou un administrateur
 */
export const checkAuthorEditorAdmin = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
    }

    const userId = request.user._id;

    const user = await AuthService.getCurrentUser(userId);

    // Vérifier si l'utilisateur a un rôle d'auteur, d'éditeur ou d'administrateur
    const isAuthorOrAdmin = user.role === UserRole.AUTHOR || user.role === UserRole.EDITOR || user.role === UserRole.ADMIN;

    // Retourner la réponse
    return reply.status(200).send({
      isAuthorOrAdmin,
    });
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));

    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la vérification des privilèges',
      isAuthorOrAdmin: false,
    });
  }
};

/**
 * Contrôleur pour vérifier si l'utilisateur est un administrateur
 */
export const checkAdmin = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    if (!request.user) {
      return reply.status(401).send({ message: 'Non autorisé - Veuillez vous connecter' });
    }

    const userId = request.user._id;

    const user = await AuthService.getCurrentUser(userId);

    // Vérifier si l'utilisateur a un rôle d'administrateur
    const isAdmin = user.role === UserRole.ADMIN;

    // Retourner la réponse
    return reply.status(200).send({
      isAdmin,
    });
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));

    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la vérification des privilèges d\'administrateur',
      isAdmin: false,
    });
  }
};

/**
 * Contrôleur pour la déconnexion d'un utilisateur
 */
export const logout = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    // Call logout service (returns true for success)
    await AuthService.logoutUser();

    // Supprimer le cookie de token
    reply.clearCookie('token', { path: '/' });

    // Retourner la réponse
    return reply.status(200).send({
      message: 'Déconnexion réussie',
    });
  } catch (error) {
    request.log.error(error instanceof Error ? error : new Error(String(error)));
    return reply.status(500).send({
      message: 'Une erreur est survenue lors de la déconnexion',
    });
  }
};
