/**
 * Migration script to fix image URLs in the database
 * Removes full URLs with ports and keeps only relative paths
 */

import mongoose from 'mongoose';
import { Post } from './models/post.model.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-blog';

/**
 * Extract relative path from a full URL
 * Examples:
 *   http://localhost:4200/uploads/abc.png -> /uploads/abc.png
 *   https://domain.com:4200/uploads/abc.png -> /uploads/abc.png
 *   /uploads/abc.png -> /uploads/abc.png (already correct)
 */
function extractRelativePath(url: string): string {
  if (!url) return url;

  // Already a relative path
  if (url.startsWith('/uploads/')) {
    return url;
  }

  // Extract /uploads/... from full URL
  const match = url.match(/\/uploads\/[^?#]+/);
  if (match) {
    return match[0];
  }

  // If it's just a filename, add /uploads/
  if (!url.includes('/') && !url.startsWith('http')) {
    return `/uploads/${url}`;
  }

  return url;
}

async function fixImageUrls() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find posts with potentially incorrect image URLs
    const query = {
      $or: [
        { 'coverImage.url': { $regex: ':4200' } },
        { 'coverImage.url': { $regex: ':3000' } },
        { 'coverImage.url': { $regex: 'localhost' } },
        { 'coverImage.url': { $regex: 'http://' } },
        { 'coverImage.url': { $regex: 'https://' } },
      ],
    };

    const posts = await Post.find(query);

    console.log(`📊 Found ${posts.length} posts with potentially incorrect image URLs\n`);

    if (posts.length === 0) {
      console.log('✨ No posts need fixing!');
      await mongoose.disconnect();
      return;
    }

    let fixedCount = 0;
    let skippedCount = 0;

    for (const post of posts) {
      const oldUrl = post.coverImage?.url;

      if (!oldUrl) {
        skippedCount++;
        continue;
      }

      const newUrl = extractRelativePath(oldUrl);

      if (oldUrl !== newUrl) {
        console.log(`📝 Fixing: "${post.title}"`);
        console.log(`   Before: ${oldUrl}`);
        console.log(`   After:  ${newUrl}\n`);

        post.coverImage.url = newUrl;
        await post.save();
        fixedCount++;
      } else {
        skippedCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Fixed: ${fixedCount} posts`);
    console.log(`   ⏭️  Skipped: ${skippedCount} posts (already correct or no coverImage)`);
    console.log(`   📦 Total: ${posts.length} posts checked\n`);

    console.log('✨ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the migration
fixImageUrls()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
