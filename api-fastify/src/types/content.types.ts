import { Document } from 'mongoose';

/**
 * Types de contenu disponibles
 */
export enum ContentType {
  PAGE = 'page',
  SECTION = 'section',
  BLOCK = 'block',
}

/**
 * Interface pour le modèle de contenu
 */
export interface IContent extends Document {
  title: string;
  slug: string;
  content: string;
  type: ContentType;
  position?: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type pour la création de contenu
 */
export type CreateContentInput = {
  title: string;
  content: string;
  type: ContentType;
  slug?: string;
  position?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
};

/**
 * Type pour la mise à jour de contenu
 */
export type UpdateContentInput = Partial<CreateContentInput>;

/**
 * Type pour la réponse de contenu
 */
export type ContentResponse = IContent & {
  _id: string;
};
