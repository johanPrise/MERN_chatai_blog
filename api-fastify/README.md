# API Backend Fastify pour MERN Blog

Ce projet est une API backend pour un blog MERN (MongoDB, Express, React, Node.js) utilisant Fastify comme framework.

## Technologies utilisées

- **Fastify**: Framework web rapide et léger pour Node.js
- **TypeScript**: Superset typé de JavaScript
- **MongoDB**: Base de données NoSQL
- **Mongoose**: ODM (Object Document Mapper) pour MongoDB
- **JWT**: JSON Web Tokens pour l'authentification
- **Bcrypt**: Hachage de mots de passe
- **Dotenv**: Gestion des variables d'environnement

## Prérequis

- Node.js (v16 ou supérieur)
- MongoDB (local ou distant)
- npm ou yarn

## Installation

1. Cloner le dépôt
2. Installer les dépendances
   ```bash
   npm install
   ```
3. Copier le fichier `.env.example` en `.env` et configurer les variables d'environnement
   ```bash
   cp .env.example .env
   ```
4. Démarrer le serveur de développement
   ```bash
   npm run dev
   ```

## Structure du projet

```
api-fastify/
├── src/
│   ├── config/         # Configuration (base de données, etc.)
│   ├── controllers/    # Contrôleurs
│   ├── middlewares/    # Middlewares
│   ├── models/         # Modèles Mongoose
│   ├── routes/         # Routes
│   ├── schemas/        # Schémas de validation Fastify
│   ├── services/       # Services métier
│   ├── types/          # Types TypeScript
│   ├── utils/          # Utilitaires
│   ├── index.ts        # Point d'entrée
│   └── server.ts       # Configuration du serveur
├── .env                # Variables d'environnement
├── .env.example        # Exemple de variables d'environnement
├── .gitignore          # Fichiers à ignorer par Git
├── package.json        # Dépendances et scripts
├── tsconfig.json       # Configuration TypeScript
└── README.md           # Documentation
```

## Scripts disponibles

- `npm run dev`: Démarre le serveur de développement avec hot-reload
- `npm run build`: Compile le code TypeScript
- `npm start`: Démarre le serveur en production
- `npm run prod`: Démarre le serveur en production avec NODE_ENV=production
- `npm run lint`: Vérifie le code avec ESLint
- `npm run lint:fix`: Corrige les erreurs ESLint

## API Endpoints

### Authentification

- `POST /api/auth/register`: Inscription d'un nouvel utilisateur
- `POST /api/auth/login`: Connexion d'un utilisateur
- `GET /api/auth/verify-email/:token`: Vérification d'email
- `POST /api/auth/forgot-password`: Demande de réinitialisation de mot de passe
- `POST /api/auth/reset-password`: Réinitialisation de mot de passe
- `POST /api/auth/change-password`: Changement de mot de passe (authentifié)
- `GET /api/auth/me`: Récupération des informations de l'utilisateur connecté (authentifié)

### Utilisateurs

- `GET /api/users`: Récupération de tous les utilisateurs (admin)
- `GET /api/users/:id`: Récupération d'un utilisateur par ID
- `PUT /api/users/:id`: Mise à jour d'un utilisateur (authentifié)
- `DELETE /api/users/:id`: Suppression d'un utilisateur (admin)

### Articles

- `GET /api/posts`: Récupération de tous les articles
- `GET /api/posts/:id`: Récupération d'un article par ID
- `POST /api/posts`: Création d'un nouvel article (authentifié)
- `PUT /api/posts/:id`: Mise à jour d'un article (authentifié)
- `DELETE /api/posts/:id`: Suppression d'un article (authentifié)
- `POST /api/posts/:id/like`: Like d'un article (authentifié)
- `POST /api/posts/:id/unlike`: Unlike d'un article (authentifié)

### Commentaires

- `GET /api/comments`: Récupération de tous les commentaires
- `GET /api/comments/:id`: Récupération d'un commentaire par ID
- `POST /api/comments`: Création d'un nouveau commentaire (authentifié)
- `PUT /api/comments/:id`: Mise à jour d'un commentaire (authentifié)
- `DELETE /api/comments/:id`: Suppression d'un commentaire (authentifié)
- `POST /api/comments/:id/like`: Like d'un commentaire (authentifié)
- `POST /api/comments/:id/unlike`: Unlike d'un commentaire (authentifié)

### Catégories

- `GET /api/categories`: Récupération de toutes les catégories
- `GET /api/categories/:id`: Récupération d'une catégorie par ID
- `POST /api/categories`: Création d'une nouvelle catégorie (admin)
- `PUT /api/categories/:id`: Mise à jour d'une catégorie (admin)
- `DELETE /api/categories/:id`: Suppression d'une catégorie (admin)

### Contenu

- `GET /api/content`: Récupération de tout le contenu
- `GET /api/content/:slug`: Récupération d'un contenu par slug
- `POST /api/content`: Création d'un nouveau contenu (admin)
- `PUT /api/content/:id`: Mise à jour d'un contenu (admin)
- `DELETE /api/content/:id`: Suppression d'un contenu (admin)

## Licence

MIT
