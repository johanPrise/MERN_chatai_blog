import { Category } from '../models/category.model.js';
import { Post } from '../models/post.model.js';
import { isValidObjectId, generateSlug } from '../utils/index.js';
import { CreateCategoryInput, UpdateCategoryInput, ICategory, CategoryResponse } from '../types/category.types.js';
import { PostStatus } from '../types/post.types.js';

/**
 * Service pour récupérer toutes les catégories
 */
export const getAllCategories = async () => {
  // Récupérer toutes les catégories
  const categories = await Category.find().sort({ name: 1 }) as ICategory[];

  // Récupérer le nombre d'articles pour chaque catégorie
  const categoriesWithPostCount = await Promise.all(
    categories.map(async (category) => {
      const postCount = await Post.countDocuments({
        categories: category._id,
        status: PostStatus.PUBLISHED,
      });

      const categoryObj = category.toObject();
      return {
        ...categoryObj,
        postCount,
      } as CategoryResponse;
    })
  );

  return categoriesWithPostCount;
};

/**
 * Service pour récupérer une catégorie par ID ou slug
 */
export const getCategoryByIdOrSlug = async (idOrSlug: string) => {
  // Construire la requête
  let query: any = {};

  // Vérifier si l'identifiant est un ID MongoDB ou un slug
  if (isValidObjectId(idOrSlug)) {
    query._id = idOrSlug;
  } else {
    query.slug = idOrSlug;
  }

  // Récupérer la catégorie
  const category = await Category.findOne(query).populate('parent', '_id name slug') as ICategory;

  // Vérifier si la catégorie existe
  if (!category) {
    throw new Error('Catégorie non trouvée');
  }

  // Compter le nombre d'articles dans cette catégorie
  const postCount = await Post.countDocuments({
    categories: category._id,
    status: PostStatus.PUBLISHED,
  });

  // Convertir en objet pour pouvoir ajouter des propriétés
  const categoryObj = category.toObject();

  return {
    ...categoryObj,
    postCount
  } as CategoryResponse;
};

/**
 * Service pour créer une nouvelle catégorie
 */
export const createCategory = async (categoryData: CreateCategoryInput) => {
  const { name, description, image, parent } = categoryData;

  // Vérifier si une catégorie avec ce nom existe déjà
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    throw new Error('Une catégorie avec ce nom existe déjà');
  }

  // Générer un slug à partir du nom
  const slug = generateSlug(name);

  // Vérifier si la catégorie parent existe
  if (parent) {
    if (!isValidObjectId(parent)) {
      throw new Error('ID de catégorie parent invalide');
    }

    const parentCategory = await Category.findById(parent);
    if (!parentCategory) {
      throw new Error('Catégorie parent non trouvée');
    }
  }

  // Créer une nouvelle catégorie
  const newCategory = new Category({
    name,
    slug,
    description,
    image,
    parent,
  });

  // Sauvegarder la catégorie
  await newCategory.save();

  return {
    _id: newCategory._id,
    name: newCategory.name,
    slug: newCategory.slug,
  };
};

/**
 * Service pour mettre à jour une catégorie
 */
export const updateCategory = async (id: string, updateData: UpdateCategoryInput) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID catégorie invalide');
  }

  // Récupérer la catégorie
  const category = await Category.findById(id);

  // Vérifier si la catégorie existe
  if (!category) {
    throw new Error('Catégorie non trouvée');
  }

  // Vérifier si le nom est déjà utilisé par une autre catégorie
  if (updateData.name && updateData.name !== category.name) {
    const existingCategory = await Category.findOne({ name: updateData.name });
    if (existingCategory) {
      throw new Error('Une catégorie avec ce nom existe déjà');
    }

    // Générer un nouveau slug si le nom est modifié
    const updatedData = updateData as any;
    updatedData.slug = generateSlug(updateData.name);
  }

  // Vérifier si la catégorie parent existe
  if (updateData.parent) {
    if (!isValidObjectId(updateData.parent)) {
      throw new Error('ID de catégorie parent invalide');
    }

    // Empêcher une catégorie d'être son propre parent
    if (updateData.parent === id) {
      throw new Error('Une catégorie ne peut pas être son propre parent');
    }

    const parentCategory = await Category.findById(updateData.parent);
    if (!parentCategory) {
      throw new Error('Catégorie parent non trouvée');
    }

    // Empêcher les références circulaires
    let currentParent = parentCategory;
    while (currentParent.parent) {
      if (currentParent.parent.toString() === id) {
        throw new Error('Référence circulaire détectée dans la hiérarchie des catégories');
      }
      const nextParent = await Category.findById(currentParent.parent);
      if (!nextParent) {
        break;
      }
      currentParent = nextParent;
    }
  }

  // Mettre à jour la catégorie
  const updatedCategory = await Category.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ) as ICategory;

  if (!updatedCategory) {
    throw new Error('Erreur lors de la mise à jour de la catégorie');
  }

  return {
    _id: updatedCategory._id,
    name: updatedCategory.name,
    slug: updatedCategory.slug,
  };
};

/**
 * Service pour supprimer une catégorie
 */
export const deleteCategory = async (id: string) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID catégorie invalide');
  }

  // Récupérer la catégorie
  const category = await Category.findById(id);

  // Vérifier si la catégorie existe
  if (!category) {
    throw new Error('Catégorie non trouvée');
  }

  // Vérifier si la catégorie a des sous-catégories
  const hasChildren = await Category.exists({ parent: id });
  if (hasChildren) {
    throw new Error('Impossible de supprimer une catégorie qui a des sous-catégories');
  }

  // Vérifier si la catégorie est utilisée par des articles
  const isUsed = await Post.exists({ categories: id });
  if (isUsed) {
    throw new Error('Impossible de supprimer une catégorie utilisée par des articles');
  }

  // Supprimer la catégorie
  await Category.findByIdAndDelete(id);

  return true;
};
