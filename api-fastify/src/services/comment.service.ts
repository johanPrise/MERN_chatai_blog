import { Comment } from '../models/comment.model.js';
import { Post } from '../models/post.model.js';
import { isValidObjectId } from '../utils/index.js';
import { CreateCommentInput, UpdateCommentInput, IComment } from '../types/comment.types.js';

/**
 * Service pour récupérer les commentaires d'un article
 */
export const getPostComments = async (
  postId: string,
  parentId?: string,
  page: number = 1,
  limit: number = 10,
  currentUserId?: string
) => {
  const skip = (page - 1) * limit;

  // Vérifier si l'ID de l'article est valide
  if (!isValidObjectId(postId)) {
    throw new Error('ID article invalide');
  }

  // Vérifier si l'article existe
  const postExists = await Post.exists({ _id: postId });
  if (!postExists) {
    throw new Error('Article non trouvé');
  }

  // Construire la requête
  const query: any = { post: postId };

  // Si parent est fourni, récupérer les réponses à ce commentaire
  // Sinon, récupérer les commentaires de premier niveau (sans parent)
  if (parentId) {
    if (!isValidObjectId(parentId)) {
      throw new Error('ID commentaire parent invalide');
    }
    query.parent = parentId;
  } else {
    query.parent = { $exists: false };
  }

  // Récupérer les commentaires avec pagination
  const comments = await Comment.find(query)
    .populate('author', '_id username profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit) as IComment[];

  // Compter le nombre total de commentaires
  const total = await Comment.countDocuments(query);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(total / limit);

  // Si on récupère les commentaires de premier niveau, récupérer également leurs réponses
  let commentsWithReplies = comments;

  if (!parentId) {
    commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parent: comment._id })
          .populate('author', '_id username profilePicture')
          .sort({ createdAt: 1 }) as IComment[];

        // Ajouter les champs isLiked et isDisliked pour chaque réponse si l'utilisateur est connecté
        const repliesWithLikeStatus = replies.map(reply => {
          const replyObj = reply.toObject();
          if (currentUserId) {
            replyObj.isLiked = reply.likedBy && reply.likedBy.includes(currentUserId);
            replyObj.isDisliked = reply.dislikedBy && reply.dislikedBy.includes(currentUserId);
          }
          return replyObj;
        });

        const commentObj = comment.toObject();
        commentObj.replies = repliesWithLikeStatus;

        // Ajouter les champs isLiked et isDisliked pour le commentaire si l'utilisateur est connecté
        if (currentUserId) {
          commentObj.isLiked = comment.likedBy && comment.likedBy.includes(currentUserId);
          commentObj.isDisliked = comment.dislikedBy && comment.dislikedBy.includes(currentUserId);
        }

        return commentObj;
      })
    );
  } else {
    // Ajouter les champs isLiked et isDisliked pour chaque commentaire si l'utilisateur est connecté
    commentsWithReplies = comments.map(comment => {
      const commentObj = comment.toObject();
      if (currentUserId) {
        commentObj.isLiked = comment.likedBy && comment.likedBy.includes(currentUserId);
        commentObj.isDisliked = comment.dislikedBy && comment.dislikedBy.includes(currentUserId);
      }
      return commentObj;
    });
  }

  return {
    comments: commentsWithReplies,
    total,
    page,
    limit,
    totalPages,
  };
};

/**
 * Service pour récupérer un commentaire par ID
 */
export const getCommentById = async (id: string, currentUserId?: string) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID commentaire invalide');
  }

  // Récupérer le commentaire
  const comment = await Comment.findById(id).populate('author', '_id username profilePicture') as IComment;

  // Vérifier si le commentaire existe
  if (!comment) {
    throw new Error('Commentaire non trouvé');
  }

  // Convertir en objet pour pouvoir ajouter des propriétés
  const commentObj = comment.toObject();

  // Ajouter les champs isLiked et isDisliked si l'utilisateur est connecté
  if (currentUserId) {
    commentObj.isLiked = comment.likedBy && comment.likedBy.includes(currentUserId);
    commentObj.isDisliked = comment.dislikedBy && comment.dislikedBy.includes(currentUserId);
  }

  return commentObj;
};

/**
 * Service pour créer un nouveau commentaire
 */
export const createComment = async (commentData: CreateCommentInput, authorId: string) => {
  const { content, post, parent } = commentData;

  // Vérifier si l'ID de l'article est valide
  if (!isValidObjectId(post)) {
    throw new Error('ID article invalide');
  }

  // Vérifier si l'article existe
  const postExists = await Post.exists({ _id: post });
  if (!postExists) {
    throw new Error('Article non trouvé');
  }

  // Vérifier si le commentaire parent existe (si fourni)
  if (parent) {
    if (!isValidObjectId(parent)) {
      throw new Error('ID commentaire parent invalide');
    }

    const parentComment = await Comment.findById(parent) as IComment;
    if (!parentComment) {
      throw new Error('Commentaire parent non trouvé');
    }

    // Vérifier que le commentaire parent appartient au même article
    if ((parentComment.post as any).toString() !== post) {
      throw new Error('Le commentaire parent n\'appartient pas à cet article');
    }

    // Empêcher les réponses imbriquées (pas de réponse à une réponse)
    if (parentComment.parent) {
      throw new Error('Les réponses imbriquées ne sont pas autorisées');
    }
  }

  // Créer un nouveau commentaire
  const newComment = new Comment({
    content,
    post,
    author: authorId,
    parent,
  });

  // Sauvegarder le commentaire
  await newComment.save();

  // Récupérer le commentaire avec les informations de l'auteur
  const populatedComment = await Comment.findById(newComment._id).populate(
    'author',
    '_id username profilePicture'
  ) as IComment;

  return populatedComment;
};

/**
 * Service pour mettre à jour un commentaire
 */
export const updateComment = async (
  id: string,
  updateData: UpdateCommentInput,
  currentUserId: string,
  currentUserRole: string
) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID commentaire invalide');
  }

  // Récupérer le commentaire
  const comment = await Comment.findById(id) as IComment;

  // Vérifier si le commentaire existe
  if (!comment) {
    throw new Error('Commentaire non trouvé');
  }

  // Vérifier si l'utilisateur actuel est autorisé à mettre à jour ce commentaire
  const isAuthor = (comment.author as any).toString() === currentUserId;
  const isAdmin = currentUserRole === 'admin';

  if (!isAuthor && !isAdmin) {
    throw new Error('Vous n\'êtes pas autorisé à mettre à jour ce commentaire');
  }

  // Mettre à jour le commentaire
  comment.content = updateData.content;
  await comment.save();

  return {
    _id: comment._id,
    content: comment.content,
  };
};

/**
 * Service pour supprimer un commentaire
 */
export const deleteComment = async (id: string, currentUserId: string, currentUserRole: string) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID commentaire invalide');
  }

  // Récupérer le commentaire
  const comment = await Comment.findById(id) as IComment;

  // Vérifier si le commentaire existe
  if (!comment) {
    throw new Error('Commentaire non trouvé');
  }

  // Vérifier si l'utilisateur actuel est autorisé à supprimer ce commentaire
  const isAuthor = (comment.author as any).toString() === currentUserId;
  const isAdmin = currentUserRole === 'admin';

  if (!isAuthor && !isAdmin) {
    throw new Error('Vous n\'êtes pas autorisé à supprimer ce commentaire');
  }

  // Supprimer le commentaire
  await Comment.findByIdAndDelete(id);

  // Si c'est un commentaire parent, supprimer également ses réponses
  if (!comment.parent) {
    await Comment.deleteMany({ parent: id });
  }

  return true;
};

/**
 * Service pour liker un commentaire
 */
export const likeComment = async (id: string, userId: string) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID commentaire invalide');
  }

  // Récupérer le commentaire
  const comment = await Comment.findById(id) as IComment;

  // Vérifier si le commentaire existe
  if (!comment) {
    throw new Error('Commentaire non trouvé');
  }

  // Vérifier si l'utilisateur a déjà liké le commentaire
  if (comment.likedBy && comment.likedBy.includes(userId)) {
    // Si déjà liké, on retire le like
    comment.likedBy = comment.likedBy.filter(id => id.toString() !== userId);
    comment.likeCount = Math.max(0, comment.likeCount - 1);
  } else {
    // Sinon, on ajoute le like
    if (!comment.likedBy) comment.likedBy = [];
    comment.likedBy.push(userId);
    comment.likeCount += 1;

    // Si l'utilisateur avait disliké, on retire le dislike
    if (comment.dislikedBy && comment.dislikedBy.includes(userId)) {
      comment.dislikedBy = comment.dislikedBy.filter(id => id.toString() !== userId);
      comment.dislikeCount = Math.max(0, (comment.dislikeCount || 0) - 1);
    }
  }

  await comment.save();

  return {
    likes: comment.likedBy || [],
    dislikes: comment.dislikedBy || [],
  };
};

/**
 * Service pour unliker un commentaire
 */
export const unlikeComment = async (id: string, userId: string) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID commentaire invalide');
  }

  // Récupérer le commentaire
  const comment = await Comment.findById(id) as IComment;

  // Vérifier si le commentaire existe
  if (!comment) {
    throw new Error('Commentaire non trouvé');
  }

  // Vérifier si l'utilisateur a liké le commentaire
  if (!comment.likedBy.includes(userId)) {
    throw new Error('Vous n\'avez pas liké ce commentaire');
  }

  // Retirer l'utilisateur de la liste des likes et décrémenter le compteur
  comment.likedBy = comment.likedBy.filter((likeId: any) => likeId.toString() !== userId);
  comment.likeCount -= 1;
  await comment.save();

  return {
    likeCount: comment.likeCount,
  };
};

/**
 * Service pour disliker un commentaire
 */
export const dislikeComment = async (id: string, userId: string) => {
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID commentaire invalide');
  }

  // Récupérer le commentaire
  const comment = await Comment.findById(id) as IComment;

  // Vérifier si le commentaire existe
  if (!comment) {
    throw new Error('Commentaire non trouvé');
  }

  // Vérifier si l'utilisateur a déjà disliké le commentaire
  if (comment.dislikedBy && comment.dislikedBy.includes(userId)) {
    // Si déjà disliké, on retire le dislike
    comment.dislikedBy = comment.dislikedBy.filter(id => id.toString() !== userId);
    comment.dislikeCount = Math.max(0, (comment.dislikeCount || 0) - 1);
  } else {
    // Sinon, on ajoute le dislike
    if (!comment.dislikedBy) comment.dislikedBy = [];
    comment.dislikedBy.push(userId);
    comment.dislikeCount = (comment.dislikeCount || 0) + 1;

    // Si l'utilisateur avait liké, on retire le like
    if (comment.likedBy && comment.likedBy.includes(userId)) {
      comment.likedBy = comment.likedBy.filter(id => id.toString() !== userId);
      comment.likeCount = Math.max(0, comment.likeCount - 1);
    }
  }

  await comment.save();

  return {
    likes: comment.likedBy || [],
    dislikes: comment.dislikedBy || [],
  };
};
