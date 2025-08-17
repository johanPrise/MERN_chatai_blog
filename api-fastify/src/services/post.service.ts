import { Post } from '../models/post.model.js';
import { Category } from '../models/category.model.js';
import { isValidObjectId, generateSlug, extractExcerpt } from '../utils/index.js';
import {
  CreatePostInput,
  UpdatePostInput,
  PostStatus,
  IPost,
  PostResponse,
} from '../types/post.types.js';

// Helper: convert block-based content to plain text for excerpt/search
const blocksToPlainText = (blocks: any[] | undefined | null): string => {
  if (!Array.isArray(blocks)) return '';
  const parts: string[] = [];
  for (const b of blocks) {
    if (!b) continue;
    // Support either our flexible schema {type, data} or flattened blocks
    const type = b.type;
    const data = (b.data ?? b);
    switch (type) {
      case 'paragraph':
        if (typeof data.text === 'string') parts.push(data.text);
        break;
      case 'heading':
        if (typeof data.text === 'string') parts.push(data.text);
        break;
      case 'list':
        if (Array.isArray(data.items)) parts.push(data.items.join(' '));
        break;
      case 'quote':
        if (typeof data.text === 'string') parts.push(data.text);
        break;
      case 'callout':
        if (typeof data.text === 'string') parts.push(data.text);
        break;
      case 'code':
        if (typeof data.code === 'string') parts.push(data.code);
        break;
      case 'image':
      case 'embed':
      default:
        // ignore non-text blocks
        break;
    }
  }
  return parts.join(' ').trim();
};

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

  // Exclure les articles supprimés (soft delete)
  query.isDeleted = { $ne: true };

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
    .sort({ publishedAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Compter le nombre total d'articles
  const total = await Post.countDocuments(query);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(total / limit);

  // Ajouter le champ isLiked pour chaque article si l'utilisateur est connecté
  const postsWithLikeStatus = posts.map(post => {
    const postObj = post.toObject() as PostResponse;
    const likedBy = Array.isArray((post as any).likedBy) ? (post as any).likedBy : [];
    const dislikedBy = Array.isArray((post as any).dislikedBy) ? (post as any).dislikedBy : [];

    if (currentUserId) {
      postObj.isLiked = likedBy.some((id: unknown) => String(id) === currentUserId);
      postObj.isDisliked = dislikedBy.some((id: unknown) => String(id) === currentUserId);
    }

    // Correction : ajouter un champ category (singulier, objet)
    if (Array.isArray(postObj.categories) && postObj.categories.length > 0) {
      postObj.category = postObj.categories[0];
    } else {
      postObj.category = null;
    }

    // Normaliser les noms des champs pour le frontend (toujours des chaînes)
    postObj.likes = likedBy.map((id: unknown) => String(id));
    postObj.dislikes = dislikedBy.map((id: unknown) => String(id));

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
export const getPostByIdOrSlug = async (
  idOrSlug: string,
  currentUserId?: string,
  currentUserRole?: string
) => {
  // Construire la requête
  let query: any = {};

  // Exclure les articles supprimés (soft delete)
  query.isDeleted = { $ne: true };

  // Vérifier si l'identifiant est un ID MongoDB ou un slug
  if (isValidObjectId(idOrSlug)) {
    query._id = idOrSlug;
  } else {
    query.slug = idOrSlug;
  }

  // Récupérer l'article
  const post = (await Post.findOne(query)
    .populate('author', '_id username profilePicture')
    .populate('categories', '_id name slug')) as IPost & {
    author: { _id: string; username: string; profilePicture?: string };
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

  // Correction : ajouter un champ category (singulier, objet)
  if (Array.isArray(postObj.categories) && postObj.categories.length > 0) {
    postObj.category = postObj.categories[0];
  } else {
    postObj.category = null;
  }

  // Ajouter les flags et tableaux normalisés en s'appuyant sur le document Mongoose
  const likedBy = Array.isArray((post as any).likedBy) ? (post as any).likedBy : [];
  const dislikedBy = Array.isArray((post as any).dislikedBy) ? (post as any).dislikedBy : [];

  if (currentUserId) {
    postObj.isLiked = likedBy.some((id: unknown) => String(id) === currentUserId);
    postObj.isDisliked = dislikedBy.some((id: unknown) => String(id) === currentUserId);
  }

  postObj.likes = likedBy.map((id: unknown) => String(id));
  postObj.dislikes = dislikedBy.map((id: unknown) => String(id));

  return postObj;
};

/**
 * Service pour créer un nouvel article
 */
export const createPost = async (postData: CreatePostInput, authorId: string) => {
  const { title, content, contentBlocks, excerpt, categories, tags, featuredImage, coverImage, images, status } = postData;

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
  let finalExcerpt = excerpt;
  if (!finalExcerpt) {
    if (content && content.trim()) {
      finalExcerpt = extractExcerpt(content);
    } else if (contentBlocks && contentBlocks.length > 0) {
      const plain = blocksToPlainText(contentBlocks as any);
      finalExcerpt = extractExcerpt(plain);
    }
  }

  // Vérifier si les catégories existent
  if (finalCategories && finalCategories.length > 0) {
    console.log('Checking categories:', finalCategories);
    const categoryCount = await Category.countDocuments({
      _id: { $in: finalCategories },
    });

    if (categoryCount !== finalCategories.length) {
      throw new Error("Une ou plusieurs catégories n'existent pas");
    }
  }

  // Créer un nouvel article
  const newPost = new Post({
    title,
    content,
    contentBlocks,
    excerpt: finalExcerpt,
    slug,
    author: authorId,
    categories: finalCategories,
    tags,
    featuredImage,
    coverImage,
    images,
    status: status || PostStatus.DRAFT,
  });

  // Si le statut est PUBLISHED, définir la date de publication
  if (newPost.status === PostStatus.PUBLISHED) {
    newPost.publishedAt = new Date();
  }

  // Sauvegarder l'article
  await newPost.save();

  // Retourner l'article complet peuplé pour inclure contentBlocks et autres champs
  const populated = await Post.findById(newPost._id)
    .populate('author', '_id username profilePicture')
    .populate('categories', '_id name slug');

  if (!populated) {
    // Fallback minimal si la récupération échoue pour une raison quelconque
    return {
      _id: newPost._id,
      title: newPost.title,
      slug: newPost.slug,
      status: newPost.status,
    };
  }

  const postObj = populated.toObject() as PostResponse;
  // Normaliser certains champs attendus par le frontend
  const likedBy = Array.isArray((populated as any).likedBy) ? (populated as any).likedBy : [];
  const dislikedBy = Array.isArray((populated as any).dislikedBy) ? (populated as any).dislikedBy : [];
  postObj.likes = likedBy.map((id: unknown) => String(id));
  postObj.dislikes = dislikedBy.map((id: unknown) => String(id));
  if (Array.isArray(postObj.categories) && postObj.categories.length > 0) {
    (postObj as any).category = postObj.categories[0];
  } else {
    (postObj as any).category = null as any;
  }

  return postObj;
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
  const post = (await Post.findById(id)) as IPost;

  // Vérifier si l'article existe
  if (!post) {
    throw new Error('Article non trouvé');
  }

  // Vérifier si l'utilisateur actuel est autorisé à mettre à jour cet article
  const authorId = (post.author as unknown as { toString(): string }).toString();
  const isAuthor = authorId === currentUserId;
  const isAdminOrEditor = currentUserRole === 'admin' || currentUserRole === 'editor';

  if (!isAuthor && !isAdminOrEditor) {
    throw new Error("Vous n'êtes pas autorisé à mettre à jour cet article");
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
  if (!updateData.excerpt) {
    if (updateData.content && (!post.excerpt || updateData.content !== post.content)) {
      updateData.excerpt = extractExcerpt(updateData.content);
    } else if (updateData.contentBlocks && Array.isArray(updateData.contentBlocks)) {
      const plain = blocksToPlainText(updateData.contentBlocks as any);
      if (plain) updateData.excerpt = extractExcerpt(plain);
    }
  }

  // Gestion de la date de publication
  if (updateData.status === PostStatus.PUBLISHED) {
    if (post.status !== PostStatus.PUBLISHED) {
      // Premier passage en statut publié : définir publishedAt
      updateData.publishedAt = new Date();
    }
    // Si déjà publié et qu'on reste publié, garder la date de publication originale
  } else if (updateData.status === PostStatus.DRAFT && post.status === PostStatus.PUBLISHED) {
    // Si on repasse en brouillon, on peut choisir de garder ou supprimer publishedAt
    // Ici on la garde pour l'historique, mais on pourrait la supprimer
  }

  // Compatibilité avec le frontend: si on reçoit 'category' au lieu de 'categories'
  if (!updateData.categories && (updateData as any).category) {
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
      throw new Error("Une ou plusieurs catégories n'existent pas");
    }
  }

  // Mettre à jour l'article
  const updatedPost = (await Post.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  )) as IPost | null;

  // Vérifier si l'article a bien été mis à jour
  if (!updatedPost) {
    throw new Error("Erreur lors de la mise à jour de l'article");
  }

  // Retourner l'article complet peuplé pour inclure contentBlocks et autres champs
  const populated = await Post.findById(updatedPost._id)
    .populate('author', '_id username profilePicture')
    .populate('categories', '_id name slug');

  if (!populated) {
    // Fallback minimal si la récupération échoue
    return {
      _id: updatedPost._id,
      title: updatedPost.title,
      slug: updatedPost.slug,
      status: updatedPost.status,
    };
  }

  const postObj = populated.toObject() as PostResponse;
  const likedBy = Array.isArray((populated as any).likedBy) ? (populated as any).likedBy : [];
  const dislikedBy = Array.isArray((populated as any).dislikedBy) ? (populated as any).dislikedBy : [];
  postObj.likes = likedBy.map((id: unknown) => String(id));
  postObj.dislikes = dislikedBy.map((id: unknown) => String(id));
  if (Array.isArray(postObj.categories) && postObj.categories.length > 0) {
    (postObj as any).category = postObj.categories[0];
  } else {
    (postObj as any).category = null as any;
  }

  return postObj;
};

/**
 * Service pour supprimer un article (soft delete par défaut)
 */
export const deletePost = async (
  id: string,
  currentUserId: string,
  currentUserRole: string,
  soft: boolean = true
) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID article invalide');
  }

  // Récupérer l'article
  const post = (await Post.findById(id)) as IPost;

  // Vérifier si l'article existe
  if (!post) {
    throw new Error('Article non trouvé');
  }

  // Vérifier si l'article est déjà supprimé (soft delete)
  if (post.isDeleted) {
    throw new Error('Article déjà supprimé');
  }

  // Vérifier si l'utilisateur actuel est autorisé à supprimer cet article
  const authorId = (post.author as unknown as { toString(): string }).toString();
  const isAuthor = authorId === currentUserId;
  const isAdminOrEditor = currentUserRole === 'admin' || currentUserRole === 'editor';

  if (!isAuthor && !isAdminOrEditor) {
    throw new Error("Vous n'êtes pas autorisé à supprimer cet article");
  }

  if (soft) {
    // Soft delete - marquer comme supprimé
    await Post.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: currentUserId,
    });
  } else {
    // Hard delete - supprimer définitivement (admin uniquement)
    if (currentUserRole !== 'admin') {
      throw new Error('Seuls les administrateurs peuvent supprimer définitivement un article');
    }
    await Post.findByIdAndDelete(id);
    // TODO: Supprimer également les commentaires associés à cet article
  }

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
  const post = (await Post.findById(id)) as IPost;

  // Vérifier si l'article existe
  if (!post) {
    throw new Error('Article non trouvé');
  }

  // Initialiser les tableaux s'ils n'existent pas
  if (!post.likedBy) post.likedBy = [];
  if (!post.dislikedBy) post.dislikedBy = [];

  const userHasLiked = post.likedBy.some((id: any) => id.toString() === userId);
  const userHasDisliked = post.dislikedBy.some((id: any) => id.toString() === userId);

  // Si l'utilisateur avait disliké, on retire le dislike
  if (userHasDisliked) {
    post.dislikedBy = post.dislikedBy.filter((id: any) => id.toString() !== userId);
  }

  if (userHasLiked) {
    // Si déjà liké, on retire le like (toggle)
    post.likedBy = post.likedBy.filter((id: any) => id.toString() !== userId);
  } else {
    // Sinon, on ajoute le like
    post.likedBy.push(userId as any);
  }

  await post.save();

  return {
    likes: (post.likedBy || []).map((id: unknown) => String(id)),
    dislikes: (post.dislikedBy || []).map((id: unknown) => String(id)),
    likeCount: post.likedBy.length, // Utiliser la longueur réelle du tableau
    dislikeCount: post.dislikedBy.length, // Utiliser la longueur réelle du tableau
    isLiked: !userHasLiked,
    isDisliked: false
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
  const post = (await Post.findById(id)) as IPost;

  // Vérifier si l'article existe
  if (!post) {
    throw new Error('Article non trouvé');
  }

  // Vérifier si l'utilisateur a liké l'article (comparer en chaînes pour supporter ObjectId)
  if (!post.likedBy.some((id: any) => id.toString() === userId)) {
    throw new Error("Vous n'avez pas liké cet article");
  }

  // Retirer l'utilisateur de la liste des likes
  post.likedBy = post.likedBy.filter(
    (likeId: any) => likeId.toString() !== userId
  );
  await post.save();

  return {
    likes: (post.likedBy || []).map((id: unknown) => String(id)),
    dislikes: (post.dislikedBy || []).map((id: unknown) => String(id)),
    likeCount: post.likedBy.length,
    dislikeCount: post.dislikedBy.length,
    isLiked: false,
    isDisliked: post.dislikedBy.some((id: any) => id.toString() === userId)
  };
};

/**
 * Service pour disliker un article
 */
export const dislikePost = async (id: string, userId: string) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID article invalide');
  }

  // Récupérer l'article
  const post = (await Post.findById(id)) as IPost;

  // Vérifier si l'article existe
  if (!post) {
    throw new Error('Article non trouvé');
  }

  // Initialiser les tableaux s'ils n'existent pas
  if (!post.likedBy) post.likedBy = [];
  if (!post.dislikedBy) post.dislikedBy = [];

  const userHasLiked = post.likedBy.some((id: any) => id.toString() === userId);
  const userHasDisliked = post.dislikedBy.some((id: any) => id.toString() === userId);

  // Si l'utilisateur avait liké, on retire le like
  if (userHasLiked) {
    post.likedBy = post.likedBy.filter((id: any) => id.toString() !== userId);
  }

  if (userHasDisliked) {
    // Si déjà disliké, on retire le dislike (toggle)
    post.dislikedBy = post.dislikedBy.filter((id: any) => id.toString() !== userId);
  } else {
    // Sinon, on ajoute le dislike
    post.dislikedBy.push(userId as any);
  }

  await post.save();

  return {
    likes: (post.likedBy || []).map((id: unknown) => String(id)),
    dislikes: (post.dislikedBy || []).map((id: unknown) => String(id)),
    likeCount: post.likedBy.length, // Utiliser la longueur réelle du tableau
    dislikeCount: post.dislikedBy.length, // Utiliser la longueur réelle du tableau
    isLiked: false,
    isDisliked: !userHasDisliked
  };
};
