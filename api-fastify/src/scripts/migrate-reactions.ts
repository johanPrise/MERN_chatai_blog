import mongoose from 'mongoose';
import { Comment } from '../models/comment.model.js';

async function migrateReactions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern_blog');
    
    // Supprimer les champs likeCount et dislikeCount
    await Comment.updateMany(
      {},
      { 
        $unset: { 
          likeCount: "",
          dislikeCount: ""
        }
      }
    );

    // S'assurer que tous les commentaires ont les champs likedBy et dislikedBy
    await Comment.updateMany(
      { likedBy: { $exists: false } },
      { $set: { likedBy: [] } }
    );

    await Comment.updateMany(
      { dislikedBy: { $exists: false } },
      { $set: { dislikedBy: [] } }
    );

    console.log('Migration des réactions terminée');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    process.exit(1);
  }
}

migrateReactions();