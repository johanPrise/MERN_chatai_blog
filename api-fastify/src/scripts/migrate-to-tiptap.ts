import { connectDB } from '../config/database';
import { Post } from '../models/Post';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Convertit le markdown en structure Tiptap basique
const markdownToTiptap = (markdown: string) => {
  const lines = markdown.split('\n');
  const content: any[] = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Headers
    if (line.startsWith('# ')) {
      content.push({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: line.slice(2) }]
      });
    } else if (line.startsWith('## ')) {
      content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: line.slice(3) }]
      });
    } else if (line.startsWith('### ')) {
      content.push({
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: line.slice(4) }]
      });
    } else {
      // Paragraphe simple
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: line }]
      });
    }
  }
  
  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
  };
};

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
      const tiptapDoc = markdownToTiptap(post.content || '');
      
      post.contentBlocks = [{
        type: 'tiptap',
        data: { doc: tiptapDoc }
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