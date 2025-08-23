// Windows filesystems are case-insensitive. This file ensures that any import resolving to
// "./Post.js" will forward to the actual model implementation with the correct schema
// (including content and contentBlocks).
// Do not add any schema definitions here.

export * from './post.model.js';
