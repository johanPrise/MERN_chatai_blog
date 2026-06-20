import mongoose, { Schema } from 'mongoose';
import { IWaitlistEntry } from '../types/waitlist.types.js';

const waitlistSchema = new Schema<IWaitlistEntry>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir une adresse email valide'],
    },
    // Origine de l'inscription (ex: la feature pour laquelle l'utilisateur s'inscrit)
    source: {
      type: String,
      trim: true,
      default: 'community',
      maxlength: 50,
    },
  },
  {
    timestamps: true,
  }
);

// Créer et exporter le modèle WaitlistEntry
export const WaitlistEntry = mongoose.model<IWaitlistEntry>('WaitlistEntry', waitlistSchema);
