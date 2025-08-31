import { connectDB } from '../config/database.js';
import { Post } from '../models/post.model.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Convertit le markdown en structure Tiptap basique

export const migratePosts = async () => {
  try {
    await connectDB();
    
    const posts = await Post.find({
      $or: [
        { contentBlocks: { $exists: false } },
        { contentBlocks: { $size: 0 } }
      ],
      content: { $exists: true, $ne: '' }
    });
    
    console.log(`Found ${posts.length} posts to migrate`);
    
    for (const post of posts) {
      
      post.contentBlocks = [{
        type: 'paragraph',
        text: post.content || ''
      }];
      
      await post.save();
      console.log(`Migrated post: ${post.title}`);
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

/**
 * Exécuter si appelé directement (compatible ESM)
 */
const __filename = fileURLToPath(import.meta.url);
const isDirectRun = (() => {
  const entry = process.argv[1] ? path.resolve(process.argv[1]) : '';
  return path.normalize(__filename) === path.normalize(entry);
})();

if (isDirectRun) {
  migratePosts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}