import { User } from '../models/user.model.js';
import { generateToken } from '../utils/index.js';
import {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput
} from '../types/auth.types.js';
import { IUser } from '../types/user.types.js';
import * as EmailService from './email.service.js';
import { onUserRegistered } from './notification-hooks.service.js';

/**
 * Service pour l'inscription d'un nouvel utilisateur
 */
export const registerUser = async (userData: RegisterInput) => {
  const { username, email, password, firstName, lastName } = userData;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new Error(
      existingUser.email === email
        ? 'Cet email est déjà utilisé'
        : 'Ce nom d\'utilisateur est déjà utilisé'
    );
  }

  // Créer un token de vérification
  const verificationToken = generateToken();

  // Créer un nouvel utilisateur
  const newUser = new User({
    username,
    email,
    password,
    firstName,
    lastName,
    verificationToken,
  });

  // Sauvegarder l'utilisateur
  await newUser.save();

  // Déclencher le hook de notification pour nouvel utilisateur
  try {
    await onUserRegistered(String(newUser._id), username);
  } catch (error) {
    // Log l'erreur mais ne pas faire échouer l'inscription
    console.error('Failed to create user registration notification:', error);
  }

  // Envoyer un email de vérification
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;

  const subject = 'Vérification de votre adresse email';
  const html = `
    <h1>Vérification de votre adresse email</h1>
    <p>Merci de vous être inscrit sur notre plateforme.</p>
    <p>Cliquez sur le lien ci-dessous pour vérifier votre adresse email :</p>
    <p><a href="${verificationUrl}">Vérifier mon adresse email</a></p>
  `;

  await EmailService.sendEmail(email, subject, html);

  return newUser;
};

/**
 * Service pour la connexion d'un utilisateur
 */
export const loginUser = async (credentials: LoginInput) => {
  const { email, password } = credentials;

  // Trouver l'utilisateur par email
  const user = await User.findOne({ email }) as IUser;

  // Vérifier si l'utilisateur existe
  if (!user) {
    throw new Error('Email ou mot de passe incorrect');
  }

  // Vérifier le mot de passe
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new Error('Email ou mot de passe incorrect');
  }

  // Convertir en objet simple pour éviter les problèmes de typage
  const userObj = user.toObject();

  return {
    _id: userObj._id.toString(),
    username: userObj.username,
    email: userObj.email,
    firstName: userObj.firstName,
    lastName: userObj.lastName,
    profilePicture: userObj.profilePicture,
    bio: userObj.bio,
    role: userObj.role,
    isVerified: userObj.isVerified,
    createdAt: userObj.createdAt,
    updatedAt: userObj.updatedAt
  };
};

/**
 * Service pour la vérification de l'email
 */
export const verifyUserEmail = async (token: string) => {
  // Trouver l'utilisateur par token de vérification
  const user = await User.findOne({ verificationToken: token }) as IUser;

  // Vérifier si l'utilisateur existe
  if (!user) {
    throw new Error('Token de vérification invalide');
  }

  // Mettre à jour l'utilisateur
  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  return user;
};

/**
 * Service pour la demande de réinitialisation de mot de passe
 */
export const requestPasswordReset = async (data: ForgotPasswordInput) => {
  const { email } = data;

  // Trouver l'utilisateur par email
  const user = await User.findOne({ email });

  // Si l'utilisateur n'existe pas, ne pas révéler cette information
  if (!user) {
    return null;
  }

  // Générer un token de réinitialisation
  const resetToken = generateToken();
  const resetExpires = new Date(Date.now() + 3600000); // 1 heure

  // Mettre à jour l'utilisateur
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = resetExpires;
  await user.save();

  // Envoyer un email de réinitialisation
  await EmailService.sendPasswordResetEmail(email, resetToken);

  return resetToken;
};

/**
 * Service pour la réinitialisation de mot de passe
 */
export const resetUserPassword = async (data: ResetPasswordInput) => {
  const { token, password } = data;

  // Trouver l'utilisateur par token de réinitialisation
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  // Vérifier si l'utilisateur existe
  if (!user) {
    throw new Error('Token de réinitialisation invalide ou expiré');
  }

  // Mettre à jour l'utilisateur
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return user;
};

/**
 * Service pour le changement de mot de passe
 */
export const changeUserPassword = async (userId: string, data: ChangePasswordInput) => {
  const { currentPassword, newPassword } = data;

  // Trouver l'utilisateur par ID
  const user = await User.findById(userId) as IUser;

  // Vérifier si l'utilisateur existe
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  // Vérifier le mot de passe actuel
  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    throw new Error('Mot de passe actuel incorrect');
  }

  // Mettre à jour le mot de passe
  user.password = newPassword;
  await user.save();

  return user;
};

/**
 * Service pour récupérer les informations de l'utilisateur connecté
 */
export const getCurrentUser = async (userId: string) => {
  // Trouver l'utilisateur par ID
  const user = await User.findById(userId);

  // Vérifier si l'utilisateur existe
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  return user;
};

/**
 * Service pour la déconnexion d'un utilisateur
 * Note: Avec JWT, la déconnexion côté serveur est principalement symbolique
 * car les tokens JWT sont stateless. Le client doit supprimer le token.
 */
export const logoutUser = async () => {
  // Dans une implémentation plus avancée, on pourrait:
  // 1. Ajouter le token à une liste noire (nécessite Redis ou une autre solution de cache)
  // 2. Réduire la durée de vie des tokens et utiliser des refresh tokens

  return true;
};
