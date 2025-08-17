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
  const comments = (await Comment.find(query)
    .populate('author', '_id username profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)) as IComment[];

  // Compter le nombre total de commentaires
  const total = await Comment.countDocuments(query);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(total / limit);

  // Si on récupère les commentaires de premier niveau, récupérer également leurs réponses
  let commentsWithReplies = comments;
  
  console.log('getPostComments - currentUserId:', currentUserId);
  console.log('getPostComments - comments count:', comments.length);

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
          
          if (currentUserId) {
            replyObj.isLiked = replyObj.likes.includes(currentUserId);
            replyObj.isDisliked = replyObj.dislikes.includes(currentUserId);
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
        if (currentUserId) {
          commentObj.isLiked = commentObj.likes.includes(currentUserId);
          commentObj.isDisliked = commentObj.dislikes.includes(currentUserId);
        }
        
        console.log(`Comment ${comment._id} - likedBy:`, comment.likedBy, 'dislikedBy:', comment.dislikedBy, 'normalized likes:', commentObj.likes, 'normalized dislikes:', commentObj.dislikes);

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
  if (currentUserId) {
    commentObj.isLiked = commentObj.likes.includes(currentUserId);
    commentObj.isDisliked = commentObj.dislikes.includes(currentUserId);
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
    author: authorId,
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
export const deleteComment = async (id: string, currentUserId: string, currentUserRole: string) => {
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
