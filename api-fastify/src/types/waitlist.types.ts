import { Document } from 'mongoose';

/**
 * Interface pour une inscription à la liste d'attente
 */
export interface IWaitlistEntry extends Document {
  email: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type pour rejoindre la liste d'attente
 */
export type JoinWaitlistInput = {
  email: string;
  source?: string;
};
