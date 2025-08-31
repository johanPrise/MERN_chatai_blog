import { Document } from 'mongoose';

/**
 * Rôles utilisateur disponibles
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author',
}

/**
 * Interface pour le modèle utilisateur
 */
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  bio?: string;
  role: UserRole;
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * Type pour la création d'un utilisateur
 */
export type CreateUserInput = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  bio?: string;
  role?: UserRole;
};

/**
 * Type pour la mise à jour d'un utilisateur
 */
export type UpdateUserInput = Partial<Omit<CreateUserInput, 'password'>>;

/**
 * Type pour la réponse utilisateur (sans données sensibles)
 */
export type UserResponse = Omit<IUser, 'password' | 'verificationToken' | 'resetPasswordToken' | 'resetPasswordExpires' | 'comparePassword'> & {
  _id: string;
};
