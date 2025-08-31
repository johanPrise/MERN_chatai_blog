import { Document } from 'mongoose';

/**
 * Interface pour le modèle de catégorie
 */
export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: ICategory['_id'];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type pour la création d'une catégorie
 */
export type CreateCategoryInput = {
  name: string;
  description?: string;
  image?: string;
  parent?: string;
};

/**
 * Type pour la mise à jour d'une catégorie
 */
export type UpdateCategoryInput = Partial<CreateCategoryInput>;

/**
 * Type pour la réponse de catégorie
 */
export type CategoryResponse = ICategory & {
  _id: string;
  postCount?: number;
};
