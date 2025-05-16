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

    // Créer des articles
    const posts = [
      {
        title: 'Introduction à Fastify',
        content: `
# Introduction à Fastify

Fastify est un framework web pour Node.js conçu pour être rapide et peu gourmand en ressources. Il est inspiré par Express et Hapi, mais offre de meilleures performances et une API plus moderne.

## Pourquoi choisir Fastify ?

- **Performance** : Fastify est l'un des frameworks Node.js les plus rapides disponibles.
- **Validation** : Validation des schémas intégrée avec JSON Schema.
- **Extensibilité** : Système de plugins puissant.
- **TypeScript** : Support natif de TypeScript.

## Installation

\`\`\`bash
npm install fastify
\`\`\`

## Exemple simple

\`\`\`javascript
import Fastify from 'fastify';

const fastify = Fastify({
  logger: true
});

fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
\`\`\`

## Conclusion

Fastify est un excellent choix pour les applications Node.js modernes qui nécessitent des performances élevées et une bonne expérience de développement.
        `,
        author: admin._id,
        categories: [createdCategories[1]._id],
        tags: ['Fastify', 'Node.js', 'JavaScript', 'Backend'],
        status: PostStatus.PUBLISHED,
      },
      {
        title: 'Les bases de MongoDB avec Mongoose',
        content: `
# Les bases de MongoDB avec Mongoose

MongoDB est une base de données NoSQL orientée documents qui offre de grandes performances et une excellente scalabilité. Mongoose est un ODM (Object Document Mapper) pour MongoDB et Node.js qui facilite l'interaction avec la base de données.

## Installation

\`\`\`bash
npm install mongoose
\`\`\`

## Connexion à MongoDB

\`\`\`javascript
import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/myapp')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
\`\`\`

## Définition d'un schéma

\`\`\`javascript
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
\`\`\`

## Opérations CRUD

### Création

\`\`\`javascript
const newUser = new User({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'hashedPassword'
});

await newUser.save();
\`\`\`

### Lecture

\`\`\`javascript
// Trouver tous les utilisateurs
const users = await User.find();

// Trouver un utilisateur par ID
const user = await User.findById('userId');

// Trouver un utilisateur par critères
const user = await User.findOne({ username: 'john_doe' });
\`\`\`

### Mise à jour

\`\`\`javascript
await User.findByIdAndUpdate('userId', { email: 'newemail@example.com' });
\`\`\`

### Suppression

\`\`\`javascript
await User.findByIdAndDelete('userId');
\`\`\`

## Conclusion

Mongoose simplifie considérablement l'utilisation de MongoDB dans les applications Node.js en fournissant une structure et des validations pour vos données.
        `,
        author: editor._id,
        categories: [createdCategories[1]._id],
        tags: ['MongoDB', 'Mongoose', 'Node.js', 'Database'],
        status: PostStatus.PUBLISHED,
      },
      {
        title: 'Introduction à l\'Intelligence Artificielle',
        content: `
# Introduction à l'Intelligence Artificielle

L'intelligence artificielle (IA) est un domaine de l'informatique qui vise à créer des machines capables de simuler l'intelligence humaine. Elle englobe plusieurs sous-domaines comme le machine learning, le deep learning et le traitement du langage naturel.

## Les différents types d'IA

### IA faible (ou étroite)

L'IA faible est conçue pour effectuer une tâche spécifique, comme la reconnaissance vocale ou la conduite autonome. C'est le type d'IA que nous utilisons aujourd'hui.

### IA forte (ou générale)

L'IA forte serait capable de comprendre, d'apprendre et d'appliquer ses connaissances à n'importe quelle tâche, comme un être humain. Elle n'existe pas encore.

## Applications de l'IA

- **Santé** : Diagnostic médical, découverte de médicaments
- **Finance** : Détection de fraudes, trading algorithmique
- **Transport** : Véhicules autonomes
- **Marketing** : Personnalisation, analyse de sentiments
- **Éducation** : Systèmes d'apprentissage adaptatifs

## Défis et considérations éthiques

L'IA soulève de nombreuses questions éthiques :

- Vie privée et surveillance
- Biais algorithmiques
- Automatisation et impact sur l'emploi
- Responsabilité et transparence
- Sécurité et contrôle

## Conclusion

L'IA continue de progresser rapidement et transforme de nombreux aspects de notre société. Comprendre ses principes fondamentaux, ses applications et ses implications éthiques est essentiel pour naviguer dans ce nouveau paysage technologique.
        `,
        author: admin._id,
        categories: [createdCategories[2]._id],
        tags: ['IA', 'Machine Learning', 'Deep Learning', 'Éthique'],
        status: PostStatus.PUBLISHED,
      },
      {
        title: 'Sécuriser votre application web',
        content: `
# Sécuriser votre application web

La sécurité est un aspect crucial du développement web. Voici quelques bonnes pratiques pour sécuriser votre application web.

## 1. Authentification sécurisée

- Utilisez des mots de passe forts et le hachage avec bcrypt ou Argon2
- Implémentez l'authentification à deux facteurs (2FA)
- Utilisez des tokens JWT avec une durée de vie limitée
- Gérez correctement les sessions

## 2. Protection contre les attaques courantes

### Injection SQL

Utilisez des requêtes paramétrées ou des ORM pour éviter les injections SQL.

\`\`\`javascript
// Mauvais
db.query(\`SELECT * FROM users WHERE username = '\${username}'\`);

// Bon
db.query('SELECT * FROM users WHERE username = ?', [username]);
\`\`\`

### Cross-Site Scripting (XSS)

Échappez toujours les données utilisateur avant de les afficher.

\`\`\`javascript
// Utilisez des bibliothèques comme DOMPurify
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
\`\`\`

### Cross-Site Request Forgery (CSRF)

Utilisez des tokens CSRF pour les formulaires et les requêtes.

## 3. HTTPS

Utilisez toujours HTTPS en production avec des certificats valides.

## 4. Gestion des dépendances

- Maintenez vos dépendances à jour
- Utilisez npm audit ou snyk pour vérifier les vulnérabilités

## 5. Validation des entrées

Validez toujours les entrées utilisateur côté serveur.

\`\`\`javascript
import { z } from 'zod';

const userSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  age: z.number().min(18).max(120),
});

const validateUser = (data) => {
  return userSchema.parse(data);
};
\`\`\`

## Conclusion

La sécurité est un processus continu, pas un état final. Restez informé des nouvelles vulnérabilités et mettez régulièrement à jour vos connaissances et vos applications.
        `,
        author: editor._id,
        categories: [createdCategories[3]._id, createdCategories[1]._id],
        tags: ['Sécurité', 'Web', 'HTTPS', 'Authentification'],
        status: PostStatus.PUBLISHED,
      },
      {
        title: 'Article en brouillon',
        content: 'Ceci est un article en cours de rédaction...',
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
        content: post.content,
        excerpt: post.content.substring(0, 200) + '...',
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
