import mongoose, { Schema } from 'mongoose';
import { ICategory } from '../types/category.types.js';

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 50,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    image: {
      type: String,
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances des recherches
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });

// Créer et exporter le modèle Category
export const Category = mongoose.model<ICategory>('Category', categorySchema);
