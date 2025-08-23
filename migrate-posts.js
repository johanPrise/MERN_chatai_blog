const { execSync } = require('child_process');

console.log('🚀 Starting Tiptap migration...');

try {
  // Exécuter le script de migration
  execSync('cd api-fastify && npm run migrate:tiptap', { stdio: 'inherit' });
  console.log('✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}