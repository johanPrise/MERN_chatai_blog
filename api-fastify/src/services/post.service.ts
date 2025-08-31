import { Post } from '../models/post.model.js';
import { Category } from '../models/category.model.js';
import { User } from '../models/user.model.js';
import { isValidObjectId, generateSlug, extractExcerpt } from '../utils/index.js';
import {
  CreatePostInput,
  UpdatePostInput,
  PostStatus,
  IPost,
  PostResponse,
} from '../types/post.types.js';
import { onPostPublished } from './notification-hooks.service.js';

// Helper: convert block-based content to plain text for excerpt/search
const blocksToPlainText = (blocks: any[] | undefined | null): string => {
  if (!Array.isArray(blocks)) return '';
  const parts: string[] = [];
  for (const b of blocks) {
    if (!b) continue;
    // Support either our flexible schema {type, data} or flattened blocks
    const type = b.type;
    const data = b.data ?? b;
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

    // Alias frontend: summary = excerpt
    (postObj as any).summary = postObj.excerpt ?? null;
    
    // Alias frontend: views = viewCount
    (postObj as any).views = postObj.viewCount ?? 0;

    // Keep coverImage as object structure for consistent frontend handling
    if (postObj && (postObj as any).coverImage) {
      // Ensure coverImage is always an object with url and alt
      if (typeof (postObj as any).coverImage === 'string') {
        // Handle legacy string data by converting to object
        (postObj as any).coverImage = {
          url: (postObj as any).coverImage,
          alt: ''
        };
      }
      // Ensure object has required properties
      if (typeof (postObj as any).coverImage === 'object' && !(postObj as any).coverImage.alt) {
        (postObj as any).coverImage.alt = '';
      }
    }

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
  console.log('[getPostByIdOrSlug] View count logic:', {
    currentUserId,
    authorId: post.author._id.toString(),
    isAuthor: currentUserId === post.author._id.toString(),
    currentViewCount: post.viewCount
  });
  
  if (!currentUserId || currentUserId !== post.author._id.toString()) {
    post.viewCount += 1;
    await post.save();
    console.log('[getPostByIdOrSlug] View count incremented to:', post.viewCount);
  } else {
    console.log('[getPostByIdOrSlug] View count not incremented (author viewing own post)');
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

  // Alias frontend: summary = excerpt
  (postObj as any).summary = postObj.excerpt ?? null;
  
  // Alias frontend: views = viewCount
  (postObj as any).views = postObj.viewCount ?? 0;

  // Keep coverImage as object structure for consistent frontend handling
  if (postObj && (postObj as any).coverImage) {
    // Ensure coverImage is always an object with url and alt
    if (typeof (postObj as any).coverImage === 'string') {
      // Handle legacy string data by converting to object
      (postObj as any).coverImage = {
        url: (postObj as any).coverImage,
        alt: ''
      };
    }
    // Ensure object has required properties
    if (typeof (postObj as any).coverImage === 'object' && !(postObj as any).coverImage.alt) {
      (postObj as any).coverImage.alt = '';
    }
  }

  return postObj;
};

/**
 * Service pour créer un nouvel article
 */
export const createPost = async (postData: CreatePostInput, authorId: string) => {
  const { title, categories, tags, featuredImage, coverImage, images, status } = postData;
  let { content, contentBlocks, excerpt } = postData as any;

  // Compatibilité: accepter 'summary' depuis le frontend et le mapper à 'excerpt'
  if (!excerpt && (postData as any).summary) {
    excerpt = (postData as any).summary;
  }

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
      // Compat: si aucun content (markdown) fourni, remplir avec le texte brut issu des blocks
      if (!content || !content.trim()) {
        content = plain;
      }
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

  // Créer une notification pour tout nouveau post (brouillon ou publié)
  try {
    const author = await User.findById(authorId).select('username');
    if (author) {
      const { createNotification } = await import('./notification.service.js');
      await createNotification({
        type: newPost.status === PostStatus.PUBLISHED ? 'post_published' : 'user_activity',
        title: newPost.status === PostStatus.PUBLISHED ? 'Nouveau post publié' : 'Nouveau post créé',
        message: newPost.status === PostStatus.PUBLISHED 
          ? `${author.username} a publié un nouveau post: "${newPost.title}".`
          : `${author.username} a créé un nouveau brouillon: "${newPost.title}".`,
        priority: newPost.status === PostStatus.PUBLISHED ? 'low' : 'medium',
        actionUrl: `/admin/posts/${newPost._id}`,
        metadata: {
          postId: String(newPost._id),
          postTitle: newPost.title,
          username: author.username,
          status: newPost.status
        },
      });
    }
  } catch (error) {
    console.error('Failed to create post notification:', error);
  }

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
  const dislikedBy = Array.isArray((populated as any).dislikedBy)
    ? (populated as any).dislikedBy
    : [];
  postObj.likes = likedBy.map((id: unknown) => String(id));
  postObj.dislikes = dislikedBy.map((id: unknown) => String(id));
  if (Array.isArray(postObj.categories) && postObj.categories.length > 0) {
    (postObj as any).category = postObj.categories[0];
  } else {
    (postObj as any).category = null as any;
  }

  // Alias frontend: summary = excerpt
  (postObj as any).summary = postObj.excerpt ?? null;
  
  // Alias frontend: views = viewCount
  (postObj as any).views = postObj.viewCount ?? 0;

  // Keep coverImage as object structure for consistent frontend handling
  if (postObj && (postObj as any).coverImage) {
    // Ensure coverImage is always an object with url and alt
    if (typeof (postObj as any).coverImage === 'string') {
      // Handle legacy string data by converting to object
      (postObj as any).coverImage = {
        url: (postObj as any).coverImage,
        alt: ''
      };
    }
    // Ensure object has required properties
    if (typeof (postObj as any).coverImage === 'object' && !(postObj as any).coverImage.alt) {
      (postObj as any).coverImage.alt = '';
    }
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
  console.log('[updatePost] Service called', {
    id,
    currentUserId,
    currentUserRole,
    updateDataKeys: Object.keys(updateData),
    status: updateData.status,
    title: updateData.title?.substring(0, 50) + '...',
  });

  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    console.log('[updatePost] Invalid ID', { id });
    throw new Error('ID article invalide');
  }

  // Récupérer l'article avec populate pour avoir les infos complètes
  const post = (await Post.findById(id).populate('author', '_id username role')) as IPost & {
    author: { _id: string; username: string; role: string };
  };

  // Vérifier si l'article existe
  if (!post) {
    console.log('[updatePost] Post not found', { id });
    throw new Error('Article non trouvé');
  }

  // Vérifier si l'article est supprimé
  if (post.isDeleted) {
    console.log('[updatePost] Post is deleted', { id });
    throw new Error('Article non trouvé');
  }

  console.log('[updatePost] Post found', {
    postId: post._id,
    postTitle: post.title,
    postAuthor: post.author._id,
    postStatus: post.status,
    currentUserId,
    currentUserRole,
  });

  // Vérifier si l'utilisateur actuel est autorisé à mettre à jour cet article
  const authorId = post.author._id.toString();
  const isAuthor = authorId === currentUserId;
  const isAdminOrEditor = currentUserRole === 'admin' || currentUserRole === 'editor';

  console.log('[updatePost] Permission check', {
    authorId,
    currentUserId,
    isAuthor,
    isAdminOrEditor,
    currentUserRole,
  });

  if (!isAuthor && !isAdminOrEditor) {
    console.log('[updatePost] Permission denied', { authorId, currentUserId, currentUserRole });
    throw new Error("Vous n'êtes pas autorisé à mettre à jour cet article");
  }

  // Préparer les données de mise à jour
  const cleanUpdateData: any = { ...updateData };

  // Si le titre est modifié, générer un nouveau slug
  if (cleanUpdateData.title && cleanUpdateData.title !== post.title) {
    cleanUpdateData.slug = generateSlug(cleanUpdateData.title);
    console.log('[updatePost] Generated new slug', {
      oldTitle: post.title,
      newTitle: cleanUpdateData.title,
      slug: cleanUpdateData.slug,
    });
  }

  // Gérer le champ summary (compatibilité avec le frontend)
  if (cleanUpdateData.summary) {
    cleanUpdateData.excerpt = cleanUpdateData.summary;
    delete cleanUpdateData.summary;
    console.log('[updatePost] Converted summary to excerpt');
  }

  // Si le contenu est modifié et qu'il n'y a pas d'extrait fourni, générer un nouvel extrait
  if (!cleanUpdateData.excerpt) {
    if (cleanUpdateData.content && cleanUpdateData.content !== post.content) {
      cleanUpdateData.excerpt = extractExcerpt(cleanUpdateData.content);
      console.log('[updatePost] Generated excerpt from content');
    } else if (cleanUpdateData.contentBlocks && Array.isArray(cleanUpdateData.contentBlocks)) {
      const plain = blocksToPlainText(cleanUpdateData.contentBlocks as any);
      if (plain) {
        cleanUpdateData.excerpt = extractExcerpt(plain);
        console.log('[updatePost] Generated excerpt from contentBlocks');
      }
    }
  }

  // Gestion de la date de publication
  if (cleanUpdateData.status === PostStatus.PUBLISHED) {
    if (post.status !== PostStatus.PUBLISHED) {
      // Premier passage en statut publié : définir publishedAt
      cleanUpdateData.publishedAt = new Date();
      console.log('[updatePost] Setting publishedAt for first publication');
    }
    // Si déjà publié et qu'on reste publié, garder la date de publication originale
  }

  // Compatibilité avec le frontend: si on reçoit 'category' au lieu de 'categories'
  if (!cleanUpdateData.categories && (cleanUpdateData as any).category) {
    // Si on reçoit une catégorie unique, la convertir en tableau
    const categoryId = (cleanUpdateData as any).category;
    if (typeof categoryId === 'string') {
      cleanUpdateData.categories = [categoryId];
      console.log('[updatePost] Converted single category to array:', cleanUpdateData.categories);
    }
    delete (cleanUpdateData as any).category;
  }

  // Vérifier si les catégories existent
  if (cleanUpdateData.categories && cleanUpdateData.categories.length > 0) {
    console.log('[updatePost] Checking categories:', cleanUpdateData.categories);
    const categoryCount = await Category.countDocuments({
      _id: { $in: cleanUpdateData.categories },
    });

    if (categoryCount !== cleanUpdateData.categories.length) {
      console.log('[updatePost] Invalid categories', {
        provided: cleanUpdateData.categories,
        found: categoryCount,
      });
      throw new Error("Une ou plusieurs catégories n'existent pas");
    }
  }

  // Nettoyer les champs undefined/null pour éviter les problèmes
  Object.keys(cleanUpdateData).forEach(key => {
    if (cleanUpdateData[key] === undefined) {
      delete cleanUpdateData[key];
    }
  });

  console.log('[updatePost] Final update data', {
    keys: Object.keys(cleanUpdateData),
    hasTitle: !!cleanUpdateData.title,
    hasContent: !!cleanUpdateData.content,
    hasExcerpt: !!cleanUpdateData.excerpt,
    status: cleanUpdateData.status,
    categories: cleanUpdateData.categories,
  });

  // Mettre à jour l'article
  const updatedPost = (await Post.findByIdAndUpdate(
    id,
    {
      $set: {
        ...cleanUpdateData,
        updatedAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  )) as IPost | null;

  // Vérifier si l'article a bien été mis à jour
  if (!updatedPost) {
    console.log('[updatePost] Update failed - no result');
    throw new Error("Erreur lors de la mise à jour de l'article");
  }

  console.log('[updatePost] Post updated successfully', {
    id: updatedPost._id,
    title: updatedPost.title,
    status: updatedPost.status,
  });



  // Retourner l'article complet peuplé pour inclure contentBlocks et autres champs
  const populated = await Post.findById(updatedPost._id)
    .populate('author', '_id username profilePicture role')
    .populate('categories', '_id name slug');

  if (!populated) {
    console.log('[updatePost] Failed to populate updated post');
    // Fallback minimal si la récupération échoue - utilisation de String() pour conversion sûre
    return {
      _id: updatedPost._id,
      id: String(updatedPost._id),
      title: updatedPost.title || '',
      slug: updatedPost.slug || '',
      status: updatedPost.status || PostStatus.DRAFT,
    };
  }

  // Normaliser la réponse pour le frontend
  const postObj = populated.toObject() as PostResponse;

  // Ajouter l'ID en format string pour le frontend
  (postObj as any).id = postObj._id.toString();

  // Normaliser les likes/dislikes
  const likedBy = Array.isArray((populated as any).likedBy) ? (populated as any).likedBy : [];
  const dislikedBy = Array.isArray((populated as any).dislikedBy)
    ? (populated as any).dislikedBy
    : [];
  postObj.likes = likedBy.map((id: unknown) => String(id));
  postObj.dislikes = dislikedBy.map((id: unknown) => String(id));

  // Normaliser les catégories
  if (Array.isArray(postObj.categories) && postObj.categories.length > 0) {
    (postObj as any).category = postObj.categories[0];
  } else {
    (postObj as any).category = null;
  }

  // Alias frontend: summary = excerpt
  (postObj as any).summary = postObj.excerpt ?? null;
  
  // Alias frontend: views = viewCount
  (postObj as any).views = postObj.viewCount ?? 0;

  // Keep coverImage as object structure for consistent frontend handling
  if (postObj && (postObj as any).coverImage) {
    // Ensure coverImage is always an object with url and alt
    if (typeof (postObj as any).coverImage === 'string') {
      // Handle legacy string data by converting to object
      (postObj as any).coverImage = {
        url: (postObj as any).coverImage,
        alt: ''
      };
    }
    // Ensure object has required properties
    if (typeof (postObj as any).coverImage === 'object' && !(postObj as any).coverImage.alt) {
      (postObj as any).coverImage.alt = '';
    }
  }

  // Normaliser l'auteur
  if (postObj.author && (postObj.author as any)._id && !(postObj.author as any).id) {
    (postObj.author as any).id = (postObj.author as any)._id.toString();
  }

  console.log('[updatePost] Returning normalized post', {
    id: (postObj as any).id,
    title: postObj.title,
    status: postObj.status,
    hasAuthor: !!postObj.author,
    hasCategories: Array.isArray(postObj.categories) && postObj.categories.length > 0,
  });

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
    isDisliked: false,
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
  post.likedBy = post.likedBy.filter((likeId: any) => likeId.toString() !== userId);
  await post.save();

  return {
    likes: (post.likedBy || []).map((id: unknown) => String(id)),
    dislikes: (post.dislikedBy || []).map((id: unknown) => String(id)),
    likeCount: post.likedBy.length,
    dislikeCount: post.dislikedBy.length,
    isLiked: false,
    isDisliked: post.dislikedBy.some((id: any) => id.toString() === userId),
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
    isDisliked: !userHasDisliked,
  };
};
