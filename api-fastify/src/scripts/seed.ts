import { config } from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Category } from '../models/category.model.js';
import { Post } from '../models/post.model.js';
import { Comment } from '../models/comment.model.js';
import { Content } from '../models/content.model.js';
import { UserRole } from '../types/user.types.js';
import { PostStatus } from '../types/post.types.js';
import { ContentType } from '../types/content.types.js';
import { IComment } from '../types/comment.types.js';
import { generateSlug } from '../utils/index.js';

// Charger les variables d'environnement
config();

// URI MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern_blog';

/**
 * Fonction pour initialiser la base de données avec des données de test
 */
async function seed() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully');

    // Supprimer toutes les données existantes
    await User.deleteMany({});
    await Category.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Content.deleteMany({});
    console.log('All existing data deleted');

    // Créer un utilisateur admin
    const admin = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123', // Le middleware pre('save') va hacher ce mot de passe
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isVerified: true,
    });
    await admin.save();

    // Créer un utilisateur éditeur
    const editor = new User({
      username: 'editor',
      email: 'editor@example.com',
      password: 'editor123', // Le middleware pre('save') va hacher ce mot de passe
      firstName: 'Editor',
      lastName: 'User',
      role: UserRole.EDITOR,
      isVerified: true,
    });
    await editor.save();

    // Créer un utilisateur normal
    const user = new User({
      username: 'user',
      email: 'user@example.com',
      password: 'user123', // Le middleware pre('save') va hacher ce mot de passe
      firstName: 'Normal',
      lastName: 'User',
      role: UserRole.USER,
      isVerified: true,
    });
    await user.save();

    console.log('Users created');

    // Créer des catégories
    const categories = [
      {
        name: 'Technologie',
        description: 'Articles sur la technologie, l\'informatique et l\'innovation',
      },
      {
        name: 'Développement Web',
        description: 'Articles sur le développement web, les frameworks et les bonnes pratiques',
      },
      {
        name: 'Intelligence Artificielle',
        description: 'Articles sur l\'IA, le machine learning et le deep learning',
      },
      {
        name: 'Cybersécurité',
        description: 'Articles sur la sécurité informatique et la protection des données',
      },
    ];

    const createdCategories = [];
    for (const category of categories) {
      const newCategory = new Category({
        name: category.name,
        slug: generateSlug(category.name),
        description: category.description,
      });
      await newCategory.save();
      createdCategories.push(newCategory);
    }

    console.log('Categories created');

    // Créer des articles avec contenu Tiptap
    const posts = [
      {
        title: 'Introduction à Fastify',
        contentBlocks: [{
          type: 'tiptap',
          data: {
            doc: {
              type: 'doc',
              content: [
                { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Introduction à Fastify' }] },
                { type: 'paragraph', content: [{ type: 'text', text: 'Fastify est un framework web pour Node.js conçu pour être rapide et peu gourmand en ressources.' }] },
                { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Pourquoi choisir Fastify ?' }] },
                { type: 'bulletList', content: [
                  { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Performance : Fastify est très rapide' }] }] },
                  { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Validation : Schémas JSON intégrés' }] }] },
                  { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'TypeScript : Support natif' }] }] }
                ]},
                { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'npm install fastify' }] }
              ]
            }
          }
        }],
        author: admin._id,
        categories: [createdCategories[1]._id],
        tags: ['Fastify', 'Node.js', 'JavaScript', 'Backend'],
        status: PostStatus.PUBLISHED,
      },
      {
        title: 'Les bases de MongoDB avec Mongoose',
        contentBlocks: [{
          type: 'tiptap',
          data: {
            doc: {
              type: 'doc',
              content: [
                { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Les bases de MongoDB avec Mongoose' }] },
                { type: 'paragraph', content: [{ type: 'text', text: 'MongoDB est une base de données NoSQL orientée documents. Mongoose est un ODM pour Node.js.' }] },
                { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Installation' }] },
                { type: 'codeBlock', attrs: { language: 'bash' }, content: [{ type: 'text', text: 'npm install mongoose' }] },
                { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Connexion' }] },
                { type: 'codeBlock', attrs: { language: 'javascript' }, content: [{ type: 'text', text: "import mongoose from 'mongoose';\n\nmongoose.connect('mongodb://localhost:27017/myapp');" }] }
              ]
            }
          }
        }],
        author: editor._id,
        categories: [createdCategories[1]._id],
        tags: ['MongoDB', 'Mongoose', 'Node.js', 'Database'],
        status: PostStatus.PUBLISHED,
      },
      {
        title: 'Introduction à l\'Intelligence Artificielle',
        contentBlocks: [{
          type: 'tiptap',
          data: {
            doc: {
              type: 'doc',
              content: [
                { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: "Introduction à l'Intelligence Artificielle" }] },
                { type: 'paragraph', content: [{ type: 'text', text: "L'IA vise à créer des machines capables de simuler l'intelligence humaine." }] },
                { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Applications' }] },
                { type: 'bulletList', content: [
                  { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Santé : Diagnostic médical' }] }] },
                  { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Finance : Détection de fraudes' }] }] },
                  { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Transport : Véhicules autonomes' }] }] }
                ]}
              ]
            }
          }
        }],
        author: admin._id,
        categories: [createdCategories[2]._id],
        tags: ['IA', 'Machine Learning', 'Deep Learning', 'Éthique'],
        status: PostStatus.PUBLISHED,
      },
      {
        title: 'Sécuriser votre application web',
        contentBlocks: [{
          type: 'tiptap',
          data: {
            doc: {
              type: 'doc',
              content: [
                { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Sécuriser votre application web' }] },
                { type: 'paragraph', content: [{ type: 'text', text: 'La sécurité est cruciale en développement web.' }] },
                { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Bonnes pratiques' }] },
                { type: 'bulletList', content: [
                  { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Utilisez HTTPS' }] }] },
                  { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Validez les entrées' }] }] },
                  { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Authentification sécurisée' }] }] }
                ]}
              ]
            }
          }
        }],
        author: editor._id,
        categories: [createdCategories[3]._id, createdCategories[1]._id],
        tags: ['Sécurité', 'Web', 'HTTPS', 'Authentification'],
        status: PostStatus.PUBLISHED,
      },
      {
        title: 'Article en brouillon',
        contentBlocks: [{
          type: 'tiptap',
          data: {
            doc: {
              type: 'doc',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'Ceci est un article en cours de rédaction...' }] }
              ]
            }
          }
        }],
        author: user._id,
        categories: [createdCategories[0]._id],
        tags: ['Brouillon'],
        status: PostStatus.DRAFT,
      },
    ];

    const createdPosts = [];
    for (const post of posts) {
      const newPost = new Post({
        title: post.title,
        content: '', // Vide car on utilise contentBlocks
        contentBlocks: post.contentBlocks,
        excerpt: post.title.substring(0, 200) + '...',
        slug: generateSlug(post.title),
        author: post.author,
        categories: post.categories,
        tags: post.tags,
        status: post.status,
        publishedAt: post.status === PostStatus.PUBLISHED ? new Date() : undefined,
      });
      await newPost.save();
      createdPosts.push(newPost);
    }

    console.log('Posts created');

    // Créer des commentaires
    const comments = [
      {
        content: 'Super article ! Très instructif.',
        post: createdPosts[0]._id,
        author: user._id,
      },
      {
        content: 'Merci pour ces explications claires.',
        post: createdPosts[0]._id,
        author: editor._id,
      },
      {
        content: 'J\'ai une question : comment gérer les erreurs avec Fastify ?',
        post: createdPosts[0]._id,
        author: user._id,
      },
      {
        content: 'Vous pouvez utiliser setErrorHandler pour gérer les erreurs de manière globale.',
        post: createdPosts[0]._id,
        author: admin._id,
        parent: null, // Sera défini après la création du commentaire parent
      },
      {
        content: 'Très bon tutoriel sur MongoDB !',
        post: createdPosts[1]._id,
        author: admin._id,
      },
      {
        content: 'J\'utilise Mongoose depuis des années, c\'est vraiment pratique.',
        post: createdPosts[1]._id,
        author: user._id,
      },
    ];

    // Créer les commentaires
    const createdComments = [];
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];

      // Si c'est une réponse, attendre que le commentaire parent soit créé
      if (i === 3) {
        comment.parent = createdComments[2]._id as any;
      }

      const newComment: IComment = new Comment({
        content: comment.content,
        post: comment.post,
        author: comment.author,
        parent: comment.parent,
      });

      await newComment.save();
      createdComments.push(newComment);
    }

    console.log('Comments created');

    // Créer du contenu statique
    const contents = [
      {
        title: 'À propos',
        slug: 'about',
        content: `
# À propos de notre blog

Bienvenue sur notre blog dédié à la technologie, au développement web et à l'intelligence artificielle.

## Notre mission

Notre mission est de partager des connaissances, des tutoriels et des actualités sur les dernières technologies et tendances du développement web et de l'IA.

## Notre équipe

Notre équipe est composée de développeurs passionnés et d'experts en technologie qui souhaitent partager leur savoir avec la communauté.

## Contactez-nous

N'hésitez pas à nous contacter à l'adresse contact@example.com pour toute question ou suggestion.
        `,
        type: ContentType.PAGE,
        isActive: true,
      },
      {
        title: 'Conditions d\'utilisation',
        slug: 'terms',
        content: `
# Conditions d'utilisation

Dernière mise à jour : ${new Date().toLocaleDateString()}

Veuillez lire attentivement ces conditions d'utilisation avant d'utiliser notre site web.

## 1. Acceptation des conditions

En accédant à ce site, vous acceptez d'être lié par ces conditions d'utilisation, toutes les lois et réglementations applicables, et vous acceptez que vous êtes responsable du respect des lois locales applicables.

## 2. Licence d'utilisation

Une licence limitée, non exclusive et non transférable vous est accordée pour accéder et utiliser le site pour votre usage personnel et non commercial.

## 3. Restrictions d'utilisation

Vous ne devez pas :
- Utiliser ce site d'une manière qui pourrait l'endommager ou compromettre sa sécurité
- Utiliser des robots, scrapers ou autres moyens automatisés pour accéder au site
- Collecter des informations sur les autres utilisateurs
- Utiliser le site pour des activités illégales ou non autorisées

## 4. Limitation de responsabilité

Le contenu de ce site est fourni "tel quel" sans garantie d'aucune sorte. Nous ne serons en aucun cas responsables des dommages directs, indirects, accessoires, consécutifs ou punitifs résultant de votre accès ou utilisation du site.

## 5. Modifications

Nous nous réservons le droit de modifier ces conditions à tout moment. Votre utilisation continue du site après de telles modifications constitue votre acceptation des nouvelles conditions.
        `,
        type: ContentType.PAGE,
        isActive: true,
      },
      {
        title: 'Bannière d\'accueil',
        slug: 'home-banner',
        content: `
# Bienvenue sur notre blog tech

Découvrez les dernières tendances en développement web, intelligence artificielle et cybersécurité.

[Explorez nos articles](/posts)
        `,
        type: ContentType.SECTION,
        isActive: true,
        position: 1,
      },
      {
        title: 'Footer',
        slug: 'footer',
        content: `
© ${new Date().getFullYear()} Blog Tech. Tous droits réservés.

[À propos](/about) | [Conditions d'utilisation](/terms) | [Contact](/contact)
        `,
        type: ContentType.SECTION,
        isActive: true,
        position: 99,
      },
    ];

    for (const content of contents) {
      const newContent = new Content({
        title: content.title,
        slug: content.slug,
        content: content.content,
        type: content.type,
        position: content.position || 0,
        isActive: content.isActive,
      });
      await newContent.save();
    }

    console.log('Content created');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Exécuter la fonction de seed
seed();
