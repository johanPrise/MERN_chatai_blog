import { Post } from '../models/post.model.js';
import { Category } from '../models/category.model.js';
import { isValidObjectId, generateSlug, extractExcerpt } from '../utils/index.js';
import { CreatePostInput, UpdatePostInput, PostStatus, IPost, PostResponse } from '../types/post.types.js';

/**
 * Service pour récupérer tous les articles (avec pagination et filtres)
 */
export const getAllPosts = async (
  page: number = 1,
  limit: number = 10,
  search: string = '',
  category?: string,
  tag?: string,
  author?: string,
  status: PostStatus = PostStatus.PUBLISHED,
  currentUserId?: string,
  currentUserRole?: string
) => {
  const skip = (page - 1) * limit;

  // Construire la requête de base
  let query: any = {};

  // Ajouter le filtre de statut
  // Si l'utilisateur n'est pas connecté, ne montrer que les articles publiés
  if (!currentUserId) {
    query.status = PostStatus.PUBLISHED;
  } else {
    // Si l'utilisateur est connecté mais n'est pas l'auteur ou un admin, ne montrer que les articles publiés
    if (status) {
      if (currentUserRole === 'admin' || currentUserRole === 'editor') {
        query.status = status;
      } else {
        // Pour les utilisateurs normaux, ne montrer que leurs propres brouillons ou les articles publiés
        if (status === PostStatus.DRAFT) {
          query.status = PostStatus.DRAFT;
          query.author = currentUserId;
        } else if (status === PostStatus.PUBLISHED) {
          query.status = PostStatus.PUBLISHED;
        } else {
          query.status = PostStatus.PUBLISHED;
        }
      }
    } else {
      // Si aucun statut n'est spécifié, montrer les articles publiés et les brouillons de l'utilisateur
      if (currentUserRole === 'admin' || currentUserRole === 'editor') {
        // Les admins et éditeurs peuvent voir tous les articles
      } else {
        query.$or = [
          { status: PostStatus.PUBLISHED },
          { status: PostStatus.DRAFT, author: currentUserId },
        ];
      }
    }
  }

  // Ajouter le filtre de recherche
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }

  // Ajouter le filtre de catégorie
  if (category) {
    query.categories = category;
  }

  // Ajouter le filtre de tag
  if (tag) {
    query.tags = tag;
  }

  // Ajouter le filtre d'auteur
  if (author) {
    query.author = author;
  }

  // Récupérer les articles avec pagination
  const posts = await Post.find(query)
    .populate('author', '_id username profilePicture')
    .populate('categories', '_id name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Compter le nombre total d'articles
  const total = await Post.countDocuments(query);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(total / limit);

  // Ajouter le champ isLiked pour chaque article si l'utilisateur est connecté
  const postsWithLikeStatus = posts.map(post => {
    const postObj = post.toObject() as PostResponse;
    if (currentUserId) {
      postObj.isLiked = post.likedBy.includes(currentUserId);
    }

    // Debug: Afficher les catégories pour comprendre la structure
    console.log('Post categories:', post._id, postObj.categories);

    // Correction : ajouter un champ category (singulier, objet)
    if (Array.isArray(postObj.categories) && postObj.categories.length > 0) {
      postObj.category = postObj.categories[0];
      console.log('Set category from categories array:', postObj.category);
    } else {
      postObj.category = null;
      console.log('No categories found, setting category to null');
    }

    // Debug: Afficher la catégorie après traitement
    console.log('Post category after processing:', post._id, postObj.category);

    return postObj;
  });

  return {
    posts: postsWithLikeStatus,
    total,
    page,
    limit,
    totalPages,
  };
};

/**
 * Service pour récupérer un article par ID ou slug
 */
export const getPostByIdOrSlug = async (idOrSlug: string, currentUserId?: string, currentUserRole?: string) => {
  // Construire la requête
  let query: any = {};

  // Vérifier si l'identifiant est un ID MongoDB ou un slug
  if (isValidObjectId(idOrSlug)) {
    query._id = idOrSlug;
  } else {
    query.slug = idOrSlug;
  }

  // Récupérer l'article
  const post = await Post.findOne(query)
    .populate('author', '_id username profilePicture')
    .populate('categories', '_id name slug') as IPost & {
      author: { _id: string; username: string; profilePicture?: string }
    };

  // Vérifier si l'article existe
  if (!post) {
    throw new Error('Article non trouvé');
  }

  // Vérifier si l'utilisateur a le droit de voir cet article
  if (post.status !== PostStatus.PUBLISHED) {
    // Si l'article n'est pas publié, seul l'auteur, les éditeurs et les admins peuvent le voir
    if (!currentUserId) {
      throw new Error('Article non trouvé');
    }

    const isAuthor = post.author._id.toString() === currentUserId;
    const isAdminOrEditor = currentUserRole === 'admin' || currentUserRole === 'editor';

    if (!isAuthor && !isAdminOrEditor) {
      throw new Error('Article non trouvé');
    }
  }

  // Incrémenter le compteur de vues
  // Ne pas incrémenter si c'est l'auteur qui consulte son propre article
  if (currentUserId !== post.author._id.toString()) {
    post.viewCount += 1;
    await post.save();
  }

  // Convertir en objet pour pouvoir ajouter des propriétés
  const postObj = post.toObject() as PostResponse;

  // Debug: Afficher les catégories pour comprendre la structure
  console.log('Single post categories:', post._id, postObj.categories);

  // Correction : ajouter un champ category (singulier, objet)
  if (Array.isArray(postObj.categories) && postObj.categories.length > 0) {
    postObj.category = postObj.categories[0];
    console.log('Single post: Set category from categories array:', postObj.category);
  } else {
    postObj.category = null;
    console.log('Single post: No categories found, setting category to null');
  }

  // Debug: Afficher la catégorie après traitement
  console.log('Single post category after processing:', post._id, postObj.category);

  // Ajouter le champ isLiked si l'utilisateur est connecté
  if (currentUserId) {
    postObj.isLiked = post.likedBy.includes(currentUserId);
  }

  return postObj;
};

/**
 * Service pour créer un nouvel article
 */
export const createPost = async (postData: CreatePostInput, authorId: string) => {
  const { title, content, excerpt, categories, tags, featuredImage, status } = postData;

  // Compatibilité avec le frontend: si on reçoit 'category' au lieu de 'categories'
  let finalCategories = categories;
  if (!finalCategories && (postData as any).category) {
    // Si on reçoit une catégorie unique, la convertir en tableau
    finalCategories = [(postData as any).category];
    console.log('Converted single category to array:', finalCategories);
  }

  // Générer un slug à partir du titre
  const slug = generateSlug(title);

  // Générer un extrait si non fourni
  const finalExcerpt = excerpt || extractExcerpt(content);

  // Vérifier si les catégories existent
  if (finalCategories && finalCategories.length > 0) {
    console.log('Checking categories:', finalCategories);
    const categoryCount = await Category.countDocuments({
      _id: { $in: finalCategories },
    });

    if (categoryCount !== finalCategories.length) {
      throw new Error('Une ou plusieurs catégories n\'existent pas');
    }
  }

  // Créer un nouvel article
  const newPost = new Post({
    title,
    content,
    excerpt: finalExcerpt,
    slug,
    author: authorId,
    categories: finalCategories,
    tags,
    featuredImage,
    status: status || PostStatus.DRAFT,
  });

  // Si le statut est PUBLISHED, définir la date de publication
  if (newPost.status === PostStatus.PUBLISHED) {
    newPost.publishedAt = new Date();
  }

  // Sauvegarder l'article
  await newPost.save();

  return {
    _id: newPost._id,
    title: newPost.title,
    slug: newPost.slug,
    status: newPost.status,
  };
};

/**
 * Service pour mettre à jour un article
 */
export const updatePost = async (
  id: string,
  updateData: UpdatePostInput & { slug?: string; publishedAt?: Date; summary?: string },
  currentUserId: string,
  currentUserRole: string
) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID article invalide');
  }

  // Récupérer l'article
  const post = await Post.findById(id) as IPost;

  // Vérifier si l'article existe
  if (!post) {
    throw new Error('Article non trouvé');
  }

  // Vérifier si l'utilisateur actuel est autorisé à mettre à jour cet article
  const authorId = (post.author as unknown as { toString(): string }).toString();
  const isAuthor = authorId === currentUserId;
  const isAdminOrEditor = currentUserRole === 'admin' || currentUserRole === 'editor';

  if (!isAuthor && !isAdminOrEditor) {
    throw new Error('Vous n\'êtes pas autorisé à mettre à jour cet article');
  }

  // Si le titre est modifié, générer un nouveau slug
  if (updateData.title && updateData.title !== post.title) {
    updateData.slug = generateSlug(updateData.title);
  }

  // Gérer le champ summary (compatibilité avec le frontend)
  if (updateData.summary) {
    updateData.excerpt = updateData.summary;
    delete updateData.summary;
  }

  // Si le contenu est modifié et qu'il n'y a pas d'extrait fourni, générer un nouvel extrait
  if (updateData.content && !updateData.excerpt && (!post.excerpt || updateData.content !== post.content)) {
    updateData.excerpt = extractExcerpt(updateData.content);
  }

  // Si le statut passe de brouillon à publié, définir la date de publication
  if (updateData.status === PostStatus.PUBLISHED && post.status !== PostStatus.PUBLISHED) {
    updateData.publishedAt = new Date();
  }

  // Compatibilité avec le frontend: si on reçoit 'category' au lieu de 'categories'
  if (!(updateData.categories) && (updateData as any).category) {
    // Si on reçoit une catégorie unique, la convertir en tableau
    updateData.categories = [(updateData as any).category];
    console.log('Update: Converted single category to array:', updateData.categories);
  }

  // Vérifier si les catégories existent
  if (updateData.categories && updateData.categories.length > 0) {
    console.log('Update: Checking categories:', updateData.categories);
    const categoryCount = await Category.countDocuments({
      _id: { $in: updateData.categories },
    });

    if (categoryCount !== updateData.categories.length) {
      throw new Error('Une ou plusieurs catégories n\'existent pas');
    }
  }

  // Mettre à jour l'article
  const updatedPost = await Post.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ) as IPost | null;

  // Vérifier si l'article a bien été mis à jour
  if (!updatedPost) {
    throw new Error('Erreur lors de la mise à jour de l\'article');
  }

  return {
    _id: updatedPost._id,
    title: updatedPost.title,
    slug: updatedPost.slug,
    status: updatedPost.status,
  };
};

/**
 * Service pour supprimer un article
 */
export const deletePost = async (id: string, currentUserId: string, currentUserRole: string) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID article invalide');
  }

  // Récupérer l'article
  const post = await Post.findById(id) as IPost;

  // Vérifier si l'article existe
  if (!post) {
    throw new Error('Article non trouvé');
  }

  // Vérifier si l'utilisateur actuel est autorisé à supprimer cet article
  const authorId = (post.author as unknown as { toString(): string }).toString();
  const isAuthor = authorId === currentUserId;
  const isAdminOrEditor = currentUserRole === 'admin' || currentUserRole === 'editor';

  if (!isAuthor && !isAdminOrEditor) {
    throw new Error('Vous n\'êtes pas autorisé à supprimer cet article');
  }

  // Supprimer l'article
  await Post.findByIdAndDelete(id);

  // TODO: Supprimer également les commentaires associés à cet article

  return true;
};

/**
 * Service pour liker un article
 */
export const likePost = async (id: string, userId: string) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID article invalide');
  }

  // Récupérer l'article
  const post = await Post.findById(id) as IPost;

  // Vérifier si l'article existe
  if (!post) {
    throw new Error('Article non trouvé');
  }

  // Vérifier si l'utilisateur a déjà liké l'article
  if (post.likedBy.includes(userId)) {
    throw new Error('Vous avez déjà liké cet article');
  }

  // Ajouter l'utilisateur à la liste des likes et incrémenter le compteur
  post.likedBy.push(userId);
  post.likeCount += 1;
  await post.save();

  return {
    likeCount: post.likeCount,
  };
};

/**
 * Service pour unliker un article
 */
export const unlikePost = async (id: string, userId: string) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID article invalide');
  }

  // Récupérer l'article
  const post = await Post.findById(id) as IPost;

  // Vérifier si l'article existe
  if (!post) {
    throw new Error('Article non trouvé');
  }

  // Vérifier si l'utilisateur a liké l'article
  if (!post.likedBy.includes(userId)) {
    throw new Error('Vous n\'avez pas liké cet article');
  }

  // Retirer l'utilisateur de la liste des likes et décrémenter le compteur
  post.likedBy = post.likedBy.filter(
    likeId => (likeId as unknown as { toString(): string }).toString() !== userId
  );
  post.likeCount -= 1;
  await post.save();

  return {
    likeCount: post.likeCount,
  };
};
