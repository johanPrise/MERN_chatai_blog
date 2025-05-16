import crypto from 'crypto';
import { nanoid } from 'nanoid';

/**
 * Génère un slug à partir d'un titre
 * @param title Titre à transformer en slug
 * @returns Slug généré
 */
export const generateSlug = (title: string): string => {
  // Convertir en minuscules et remplacer les caractères spéciaux par des tirets
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Ajouter un identifiant unique pour éviter les doublons
  return `${baseSlug}-${nanoid(6)}`;
};

/**
 * Génère un token aléatoire
 * @returns Token généré
 */
export const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Formate une date en chaîne de caractères lisible
 * @param date Date à formater
 * @returns Date formatée
 */
export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Tronque un texte à une longueur maximale
 * @param text Texte à tronquer
 * @param maxLength Longueur maximale
 * @returns Texte tronqué
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Extrait un extrait du contenu HTML
 * @param html Contenu HTML
 * @param maxLength Longueur maximale
 * @returns Extrait du contenu
 */
export const extractExcerpt = (html: string, maxLength: number = 160): string => {
  // Supprimer les balises HTML
  const text = html.replace(/<\/?[^>]+(>|$)/g, '');
  return truncateText(text, maxLength);
};

/**
 * Vérifie si une chaîne est un ID MongoDB valide
 * @param id ID à vérifier
 * @returns true si l'ID est valide, false sinon
 */
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
