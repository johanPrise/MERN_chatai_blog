/**
 * Type pour la demande de connexion
 */
export type LoginInput = {
  email: string;
  password: string;
};

/**
 * Type pour la demande d'inscription
 */
export type RegisterInput = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

/**
 * Type pour la réponse d'authentification
 */
export type AuthResponse = {
  token: string;
  user: {
    _id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    bio?: string;
    role: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};

/**
 * Type pour la demande de réinitialisation de mot de passe
 */
export type ForgotPasswordInput = {
  email: string;
};

/**
 * Type pour la réinitialisation de mot de passe
 */
export type ResetPasswordInput = {
  token: string;
  password: string;
};

/**
 * Type pour la vérification d'email
 */
export type VerifyEmailInput = {
  token: string;
};

/**
 * Type pour le changement de mot de passe
 */
export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};
