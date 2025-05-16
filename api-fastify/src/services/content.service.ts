import { Content } from '../models/content.model.js';
import { isValidObjectId, generateSlug } from '../utils/index.js';
import { CreateContentInput, UpdateContentInput, ContentType, IContent } from '../types/content.types.js';

/**
 * Service pour récupérer tout le contenu
 */
export const getAllContent = async (type?: ContentType, isActive?: boolean) => {
  // Construire la requête
  const query: any = {};

  // Filtrer par type si fourni
  if (type) {
    query.type = type;
  }

  // Filtrer par statut actif si fourni
  if (isActive !== undefined) {
    query.isActive = isActive;
  }

  // Récupérer le contenu
  const contents = await Content.find(query)
    .select('-content -metadata')
    .sort({ type: 1, position: 1 });

  return contents;
};

/**
 * Service pour récupérer un contenu par slug
 */
export const getContentBySlug = async (slug: string, userRole?: string) => {
  // Récupérer le contenu
  const content = await Content.findOne({ slug });

  // Vérifier si le contenu existe
  if (!content) {
    throw new Error('Contenu non trouvé');
  }

  // Vérifier si le contenu est actif (sauf pour les admins)
  if (!content.isActive && userRole !== 'admin') {
    throw new Error('Contenu non trouvé');
  }

  return content;
};

/**
 * Service pour créer un nouveau contenu
 */
export const createContent = async (contentData: CreateContentInput) => {
  const { title, content, type, slug, position, isActive, metadata } = contentData;

  // Générer un slug si non fourni
  const finalSlug = slug || generateSlug(title);

  // Vérifier si un contenu avec ce slug existe déjà
  const existingContent = await Content.findOne({ slug: finalSlug });
  if (existingContent) {
    throw new Error('Un contenu avec ce slug existe déjà');
  }

  // Créer un nouveau contenu
  const newContent = new Content({
    title,
    content,
    type,
    slug: finalSlug,
    position: position || 0,
    isActive: isActive !== undefined ? isActive : true,
    metadata: metadata || {},
  });

  // Sauvegarder le contenu
  await newContent.save();

  return {
    _id: newContent._id,
    title: newContent.title,
    slug: newContent.slug,
  };
};

/**
 * Service pour mettre à jour un contenu
 */
export const updateContent = async (id: string, updateData: UpdateContentInput) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID contenu invalide');
  }

  // Récupérer le contenu
  const content = await Content.findById(id);

  // Vérifier si le contenu existe
  if (!content) {
    throw new Error('Contenu non trouvé');
  }

  // Si le titre est modifié et qu'aucun slug n'est fourni, générer un nouveau slug
  if (updateData.title && updateData.title !== content.title && !updateData.slug) {
    updateData.slug = generateSlug(updateData.title);
  }

  // Vérifier si le slug est déjà utilisé par un autre contenu
  if (updateData.slug && updateData.slug !== content.slug) {
    const existingContent = await Content.findOne({ slug: updateData.slug });
    if (existingContent && existingContent._id &&
        (existingContent._id as unknown as { toString(): string }).toString() !== id) {
      throw new Error('Un contenu avec ce slug existe déjà');
    }
  }

  // Mettre à jour le contenu
  const updatedContent = await Content.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ) as IContent | null;

  // Vérifier si le contenu a bien été mis à jour
  if (!updatedContent) {
    throw new Error('Erreur lors de la mise à jour du contenu');
  }

  return {
    _id: updatedContent._id,
    title: updatedContent.title,
    slug: updatedContent.slug,
  };
};

/**
 * Service pour supprimer un contenu
 */
export const deleteContent = async (id: string) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID contenu invalide');
  }

  // Récupérer le contenu
  const content = await Content.findById(id);

  // Vérifier si le contenu existe
  if (!content) {
    throw new Error('Contenu non trouvé');
  }

  // Supprimer le contenu
  await Content.findByIdAndDelete(id);

  return true;
};
