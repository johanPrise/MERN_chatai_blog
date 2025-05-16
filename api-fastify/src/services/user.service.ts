import { User } from '../models/user.model.js';
import { isValidObjectId } from '../utils/index.js';
import { UpdateUserInput, UserRole } from '../types/user.types.js';

/**
 * Service pour récupérer tous les utilisateurs (avec pagination)
 */
export const getAllUsers = async (page: number = 1, limit: number = 10, search: string = '') => {
  const skip = (page - 1) * limit;

  // Construire la requête de recherche
  const searchQuery = search
    ? {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  // Récupérer les utilisateurs avec pagination
  const users = await User.find(searchQuery)
    .select('-password -verificationToken -resetPasswordToken -resetPasswordExpires')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Compter le nombre total d'utilisateurs
  const total = await User.countDocuments(searchQuery);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(total / limit);

  return {
    users,
    total,
    page,
    limit,
    totalPages,
  };
};

/**
 * Service pour récupérer un utilisateur par ID
 */
export const getUserById = async (id: string) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID utilisateur invalide');
  }

  // Récupérer l'utilisateur
  const user = await User.findById(id).select(
    '-password -verificationToken -resetPasswordToken -resetPasswordExpires'
  );

  // Vérifier si l'utilisateur existe
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  return user;
};

/**
 * Service pour mettre à jour un utilisateur
 */
export const updateUser = async (id: string, updateData: UpdateUserInput, currentUserId: string, currentUserRole: string) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID utilisateur invalide');
  }

  // Récupérer l'utilisateur
  const user = await User.findById(id);

  // Vérifier si l'utilisateur existe
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  // Vérifier si l'utilisateur actuel est autorisé à mettre à jour cet utilisateur
  if (currentUserId !== id && currentUserRole !== 'admin') {
    throw new Error('Vous n\'êtes pas autorisé à mettre à jour cet utilisateur');
  }

  // Vérifier si le nom d'utilisateur est déjà utilisé
  if (updateData.username && updateData.username !== user.username) {
    const existingUser = await User.findOne({ username: updateData.username });
    if (existingUser) {
      throw new Error('Ce nom d\'utilisateur est déjà utilisé');
    }
  }

  // Mettre à jour l'utilisateur
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');

  return updatedUser;
};

/**
 * Service pour supprimer un utilisateur
 */
export const deleteUser = async (id: string, currentUserId: string, currentUserRole: string) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID utilisateur invalide');
  }

  // Vérifier si l'utilisateur actuel est autorisé à supprimer cet utilisateur
  if (currentUserId !== id && currentUserRole !== 'admin') {
    throw new Error('Vous n\'êtes pas autorisé à supprimer cet utilisateur');
  }

  // Récupérer l'utilisateur
  const user = await User.findById(id);

  // Vérifier si l'utilisateur existe
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  // Empêcher la suppression du dernier administrateur
  if (user.role === UserRole.ADMIN) {
    const adminCount = await User.countDocuments({ role: UserRole.ADMIN });
    if (adminCount <= 1) {
      throw new Error('Impossible de supprimer le dernier administrateur');
    }
  }

  // Supprimer l'utilisateur
  await User.findByIdAndDelete(id);

  // TODO: Supprimer également les articles, commentaires, etc. associés à cet utilisateur
  // ou les marquer comme "supprimés" ou les attribuer à un utilisateur "anonyme"

  return true;
};

/**
 * Service pour changer le rôle d'un utilisateur
 */
export const changeUserRole = async (id: string, role: UserRole) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID utilisateur invalide');
  }

  // Récupérer l'utilisateur
  const user = await User.findById(id);

  // Vérifier si l'utilisateur existe
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  // Empêcher la rétrogradation du dernier administrateur
  if (user.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
    const adminCount = await User.countDocuments({ role: UserRole.ADMIN });
    if (adminCount <= 1) {
      throw new Error('Impossible de rétrograder le dernier administrateur');
    }
  }

  // Mettre à jour le rôle de l'utilisateur
  user.role = role;
  await user.save();

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
};

/**
 * Service pour récupérer le profil de l'utilisateur connecté
 */
export const getUserProfile = async (userId: string) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(userId)) {
    throw new Error('ID utilisateur invalide');
  }

  // Récupérer l'utilisateur
  const user = await User.findById(userId).select(
    '-password -verificationToken -resetPasswordToken -resetPasswordExpires'
  );

  // Vérifier si l'utilisateur existe
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  return user;
};

/**
 * Service pour mettre à jour le profil de l'utilisateur connecté
 */
export const updateUserProfile = async (userId: string, updateData: UpdateUserInput) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(userId)) {
    throw new Error('ID utilisateur invalide');
  }

  // Récupérer l'utilisateur
  const user = await User.findById(userId);

  // Vérifier si l'utilisateur existe
  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  // Vérifier si le nom d'utilisateur est déjà utilisé
  if (updateData.username && updateData.username !== user.username) {
    const existingUser = await User.findOne({ username: updateData.username });
    if (existingUser) {
      throw new Error('Ce nom d\'utilisateur est déjà utilisé');
    }
  }

  // Mettre à jour l'utilisateur
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true }
  ).select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');

  return updatedUser;
};
