import { WaitlistEntry } from '../models/waitlist.model.js';
import { JoinWaitlistInput } from '../types/waitlist.types.js';

/**
 * Inscrit une adresse email à la liste d'attente.
 * Opération idempotente : une email déjà inscrite ne provoque pas d'erreur.
 */
export const joinWaitlist = async (data: JoinWaitlistInput) => {
  const email = data.email.trim().toLowerCase();
  const source = data.source?.trim() || 'community';

  const existing = await WaitlistEntry.findOne({ email });
  if (existing) {
    return { alreadyRegistered: true };
  }

  await WaitlistEntry.create({ email, source });
  return { alreadyRegistered: false };
};
