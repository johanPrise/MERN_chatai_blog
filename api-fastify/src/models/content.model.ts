import mongoose, { Schema } from 'mongoose';
import { ContentType, IContent } from '../types/content.types.js';

const contentSchema = new Schema<IContent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(ContentType),
      required: true,
    },
    position: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances des recherches
contentSchema.index({ slug: 1 });
contentSchema.index({ type: 1, position: 1 });
contentSchema.index({ isActive: 1 });

// Créer et exporter le modèle Content
export const Content = mongoose.model<IContent>('Content', contentSchema);
