import { connectDB } from '../config/database.js';
import { Post } from '../models/post.model.js';
import { PostStatus } from '../types/post.types.js';

/**
 * Script pour corriger les dates de publication manquantes
 * Met à jour tous les articles publiés qui n'ont pas de publishedAt
 */
async function fixPublishedDates() {
  try {
    console.log('🔄 Connexion à la base de données...');
    await connectDB();

    console.log('🔍 Recherche des articles publiés sans date de publication...');
    
    // Trouver tous les articles publiés sans publishedAt
    const postsWithoutPublishedAt = await Post.find({
      status: PostStatus.PUBLISHED,
      $or: [
        { publishedAt: { $exists: false } },
        { publishedAt: null }
      ]
    });

    console.log(`📊 Trouvé ${postsWithoutPublishedAt.length} articles à corriger`);

    if (postsWithoutPublishedAt.length === 0) {
      console.log('✅ Aucun article à corriger');
      process.exit(0);
    }

    // Mettre à jour chaque article
    let updatedCount = 0;
    for (const post of postsWithoutPublishedAt) {
      try {
        // Utiliser createdAt comme date de publication par défaut
        const publishedAt = post.createdAt;
        
        await Post.findByIdAndUpdate(post._id, {
          publishedAt: publishedAt
        });

        console.log(`✅ Article "${post.title}" mis à jour avec publishedAt: ${publishedAt}`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour de l'article "${post.title}":`, error);
      }
    }

    console.log(`🎉 Terminé ! ${updatedCount}/${postsWithoutPublishedAt.length} articles mis à jour`);
    
    // Vérification finale
    console.log('🔍 Vérification finale...');
    const remainingPosts = await Post.find({
      status: PostStatus.PUBLISHED,
      $or: [
        { publishedAt: { $exists: false } },
        { publishedAt: null }
      ]
    });

    if (remainingPosts.length === 0) {
      console.log('✅ Tous les articles publiés ont maintenant une date de publication');
    } else {
      console.log(`⚠️  Il reste ${remainingPosts.length} articles sans date de publication`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du script:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Exécuter le script si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  fixPublishedDates();
}

export { fixPublishedDates };