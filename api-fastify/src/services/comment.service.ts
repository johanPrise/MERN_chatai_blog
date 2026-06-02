import { Comment } from '../models/comment.model.js';
import { Post } from '../models/post.model.js';
import { isValidObjectId } from '../utils/index.js';
import { CreateCommentInput, UpdateCommentInput, IComment } from '../types/comment.types.js';

/**
 * Service pour récupérer les commentaires d'un article
 */
interface GetPostCommentsOptions {
  postId: string;
  parentId?: string;
  page?: number;
  limit?: number;
  viewer?: { id: string };
  currentUserId?: string;
}

export const getPostComments = async (options: GetPostCommentsOptions | string, parentId?: string, page = 1, limit = 10, currentUserId?: string) => {
  let postId: string;
  let resolvedParentId: string | undefined;
  let resolvedPage: number;
  let resolvedLimit: number;
  let resolvedUserId: string | undefined;

  if (typeof options === 'object') {
    postId = options.postId;
    resolvedParentId = options.parentId;
    resolvedPage = options.page ?? 1;
    resolvedLimit = options.limit ?? 10;
    resolvedUserId = options.viewer?.id ?? options.currentUserId;
  } else {
    postId = options;
    resolvedParentId = parentId;
    resolvedPage = page;
    resolvedLimit = limit;
    resolvedUserId = currentUserId;
  }

  if (!isValidObjectId(postId)) {
    throw new Error('ID article invalide');
  }

  const postExists = await Post.exists({ _id: postId });
  if (!postExists) {
    throw new Error('Article non trouvé');
  }

  const query: any = { post: postId };

  if (resolvedParentId) {
    if (!isValidObjectId(resolvedParentId)) {
      throw new Error('ID commentaire parent invalide');
    }
    query.parent = resolvedParentId;
  } else {
    query.parent = { $exists: false };
  }

  const comments = (await Comment.find(query)
    .populate('author', '_id username profilePicture')
    .sort({ createdAt: -1 })
    .skip((resolvedPage - 1) * resolvedLimit)
    .limit(resolvedLimit)) as IComment[];

  const total = await Comment.countDocuments(query);
  const totalPages = Math.ceil(total / resolvedLimit);

  // Si on récupère les commentaires de premier niveau, récupérer également leurs réponses
  let commentsWithReplies = comments;
  

  if (!parentId) {
    commentsWithReplies = await Promise.all(
      comments.map(async comment => {
        const replies = (await Comment.find({ parent: comment._id })
          .populate('author', '_id username profilePicture')
          .sort({ createdAt: 1 })) as IComment[];

        // Ajouter les champs isLiked et isDisliked pour chaque réponse si l'utilisateur est connecté
        const repliesWithLikeStatus = replies.map(reply => {
          const replyObj = reply.toObject();
          // Normaliser les noms des champs pour le frontend
          replyObj.likes = (replyObj.likedBy || []).map((id: unknown) => String(id));
          replyObj.dislikes = (replyObj.dislikedBy || []).map((id: unknown) => String(id));
          // Dériver les compteurs
          replyObj.likeCount = replyObj.likes.length;
          replyObj.dislikeCount = replyObj.dislikes.length;
          
          if (resolvedUserId) {
            replyObj.isLiked = replyObj.likes.includes(resolvedUserId);
            replyObj.isDisliked = replyObj.dislikes.includes(resolvedUserId);
          }
          return replyObj;
        });

        const commentObj = comment.toObject();
        commentObj.replies = repliesWithLikeStatus;

        // Normaliser les noms des champs pour le frontend
        commentObj.likes = (commentObj.likedBy || []).map((id: unknown) => String(id));
        commentObj.dislikes = (commentObj.dislikedBy || []).map((id: unknown) => String(id));
        // Dériver les compteurs
        commentObj.likeCount = commentObj.likes.length;
        commentObj.dislikeCount = commentObj.dislikes.length;
        
        // Ajouter les champs isLiked et isDisliked pour le commentaire si l'utilisateur est connecté
        if (resolvedUserId) {
          commentObj.isLiked = commentObj.likes.includes(resolvedUserId);
          commentObj.isDisliked = commentObj.dislikes.includes(resolvedUserId);
        }
        
        return commentObj;
      })
    );
  } else {
    // Ajouter les champs isLiked et isDisliked pour chaque commentaire si l'utilisateur est connecté
    commentsWithReplies = comments.map(comment => {
      const commentObj = comment.toObject();
      // Normaliser les noms des champs pour le frontend
      commentObj.likes = (commentObj.likedBy || []).map((id: unknown) => String(id));
      commentObj.dislikes = (commentObj.dislikedBy || []).map((id: unknown) => String(id));
      // Dériver les compteurs
      commentObj.likeCount = commentObj.likes.length;
      commentObj.dislikeCount = commentObj.dislikes.length;
      
      if (currentUserId) {
        commentObj.isLiked = commentObj.likes.includes(currentUserId);
        commentObj.isDisliked = commentObj.dislikes.includes(currentUserId);
      }
      return commentObj;
    });
  }

  return {
    comments: commentsWithReplies,
    total,
    page: resolvedPage,
    limit: resolvedLimit,
    totalPages,
  };
};

/**
 * Service pour récupérer un commentaire par ID
 */
export const getCommentById = async (options: { id: string; viewer?: { id: string } } | string, currentUserId?: string) => {
  const id = typeof options === 'object' ? options.id : options;
  const resolvedUserId = typeof options === 'object' ? options.viewer?.id : currentUserId;
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID commentaire invalide');
  }

  // Récupérer le commentaire
  const comment = (await Comment.findById(id).populate(
    'author',
    '_id username profilePicture'
  )) as IComment;

  // Vérifier si le commentaire existe
  if (!comment) {
    throw new Error('Commentaire non trouvé');
  }

  // Convertir en objet pour pouvoir ajouter des propriétés
  const commentObj = comment.toObject();

  // Normaliser les noms des champs pour le frontend
  commentObj.likes = (commentObj.likedBy || []).map((id: unknown) => String(id));
  commentObj.dislikes = (commentObj.dislikedBy || []).map((id: unknown) => String(id));

  // Ajouter les champs isLiked et isDisliked si l'utilisateur est connecté
  if (resolvedUserId) {
    commentObj.isLiked = commentObj.likes.includes(resolvedUserId);
    commentObj.isDisliked = commentObj.dislikes.includes(resolvedUserId);
  }

  return commentObj;
};

export const createComment = async (
  options: { commentData: CreateCommentInput; author: { id: string } } | CreateCommentInput,
  authorId?: string
) => {
  const commentData = 'commentData' in options ? options.commentData : options;
  const resolvedAuthorId = 'author' in options ? options.author.id : (authorId as string);
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

    const parentComment = (await Comment.findById(parent)) as IComment;
    if (!parentComment) {
      throw new Error('Commentaire parent non trouvé');
    }

    // Vérifier que le commentaire parent appartient au même article
    if ((parentComment.post as any).toString() !== post) {
      throw new Error("Le commentaire parent n'appartient pas à cet article");
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
    author: resolvedAuthorId,
    parent,
  });

  // Sauvegarder le commentaire
  await newComment.save();

  // Récupérer le commentaire avec les informations de l'auteur
  const populatedComment = (await Comment.findById(newComment._id).populate(
    'author',
    '_id username profilePicture'
  )) as IComment;

  // Normaliser les noms des champs pour le frontend
  const commentObj = populatedComment.toObject();
  commentObj.likes = (commentObj.likedBy || []).map((id: unknown) => String(id));
  commentObj.dislikes = (commentObj.dislikedBy || []).map((id: unknown) => String(id));

  return commentObj;
};

/**
 * Service pour mettre à jour un commentaire
 */
interface CurrentUser { id: string; role: string }

export const updateComment = async (
  options: { id: string; updateData: UpdateCommentInput; currentUser: CurrentUser } | string,
  updateDataArg?: UpdateCommentInput,
  currentUserIdArg?: string,
  currentUserRoleArg?: string
) => {
  const id = typeof options === 'object' ? options.id : options;
  const updateData = typeof options === 'object' ? options.updateData : updateDataArg!;
  const currentUserId = typeof options === 'object' ? options.currentUser.id : currentUserIdArg!;
  const currentUserRole = typeof options === 'object' ? options.currentUser.role : currentUserRoleArg!;
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID commentaire invalide');
  }

  // Récupérer le commentaire
  const comment = (await Comment.findById(id)) as IComment;

  // Vérifier si le commentaire existe
  if (!comment) {
    throw new Error('Commentaire non trouvé');
  }

  // Vérifier si l'utilisateur actuel est autorisé à mettre à jour ce commentaire
  const isAuthor = (comment.author as any).toString() === currentUserId;
  const isAdmin = currentUserRole === 'admin';

  if (!isAuthor && !isAdmin) {
    throw new Error("Vous n'êtes pas autorisé à mettre à jour ce commentaire");
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
export const deleteComment = async (
  options: { id: string; currentUser: CurrentUser } | string,
  currentUserIdArg?: string,
  currentUserRoleArg?: string
) => {
  const id = typeof options === 'object' ? options.id : options;
  const currentUserId = typeof options === 'object' ? options.currentUser.id : currentUserIdArg!;
  const currentUserRole = typeof options === 'object' ? options.currentUser.role : currentUserRoleArg!;
  // Vérifier si l'ID est valide
  if (!isValidObjectId(id)) {
    throw new Error('ID commentaire invalide');
  }

  // Récupérer le commentaire
  const comment = (await Comment.findById(id)) as IComment;

  // Vérifier si le commentaire existe
  if (!comment) {
    throw new Error('Commentaire non trouvé');
  }

  // Vérifier si l'utilisateur actuel est autorisé à supprimer ce commentaire
  const isAuthor = (comment.author as any).toString() === currentUserId;
  const isAdmin = currentUserRole === 'admin';

  if (!isAuthor && !isAdmin) {
    throw new Error("Vous n'êtes pas autorisé à supprimer ce commentaire");
  }

  // Supprimer le commentaire
  await Comment.findByIdAndDelete(id);

  // Si c'est un commentaire parent, supprimer également ses réponses
  if (!comment.parent) {
    await Comment.deleteMany({ parent: id });
  }

  return true;
};

import { SimpleReactionService } from './simple-reaction.service.js';

/**
 * Service pour liker un commentaire
 */
export const likeComment = async (id: string, userId: string) => {
  return await SimpleReactionService.likeComment(id, userId);
};

/**
 * Service pour disliker un commentaire
 */
export const dislikeComment = async (id: string, userId: string) => {
  return await SimpleReactionService.dislikeComment(id, userId);
};

/**
 * Service pour unliker un commentaire
 */
export const unlikeComment = async (id: string, userId: string) => {
  return await SimpleReactionService.unlikeComment(id, userId);
};
