# Contexte du Projet : MERN-like Blog avec Fastify et React

Ce document sert de mémoire pour l'assistant IA Gemini, résumant l'architecture, les technologies et les fonctionnalités clés du projet.

## Vue d'ensemble

Le projet est une application web full-stack de type blog, construite avec une stack moderne basée sur TypeScript. Il se compose d'un backend API RESTful et d'un frontend SPA (Single Page Application).

- **Backend** : `api-fastify/`
- **Frontend** : `src/`

## Technologies

### Backend (`api-fastify`)

- **Framework**: Fastify (alternative à Express.js)
- **Langage**: TypeScript
- **Base de données**: MongoDB avec Mongoose
- **Authentification**: JWT (JSON Web Tokens) via cookies
- **Gestion des fichiers**: Upload de fichiers via `@fastify/multipart`
- **Dépendances clés**: `fastify`, `mongoose`, `bcrypt`, `jsonwebtoken`, `nodemailer`

### Frontend (`src`)

- **Framework**: React
- **Langage**: TypeScript
- **Outil de build**: Vite
- **Routage**: `react-router-dom`
- **Styling**: Tailwind CSS, complété par des composants `shadcn/ui` et potentiellement Material-UI.
- **State Management**: Contexte React (`UserContext`, `ThemeContext`).
- **Éditeur de texte**: `react-quill` pour un éditeur WYSIWYG.
- **Dépendances clés**: `react`, `react-router-dom`, `vite`, `tailwindcss`, `react-quill`, `axios` (ou `fetch` natif).

## Fonctionnalités Principales

- **Gestion des Articles (CRUD)**: Création, lecture, mise à jour et suppression d'articles de blog.
- **Catégories**: Organisation des articles par catégories.
- **Gestion des Utilisateurs**:
  - Inscription et connexion.
  - Réinitialisation de mot de passe (via email).
  - Changement de nom d'utilisateur.
- **Tableau de Bord Administrateur**: Une section `/admin` pour la gestion du site (utilisateurs, contenu, etc.).
- **Upload d'images**: Permet d'associer des images aux articles.
- **Recherche**: Fonctionnalité pour rechercher du contenu sur le blog.
- **Chatbot**: Un assistant conversationnel intégré à l'interface.

## Structure et Conventions

- Le projet est structuré comme un monorepo avec des dossiers distincts pour le frontend et le backend.
- Le backend suit une architecture classique Modèle-Vue-Contrôleur (MVC-like) avec des `routes`, `controllers`, `services` et `models`.
- Le frontend utilise une architecture basée sur les composants, avec une séparation claire entre les `pages`, les `components` réutilisables et les `hooks` personnalisés.
- Le style est géré principalement avec Tailwind CSS, favorisant une approche "utility-first".
- Les alias de chemin (`@/`) sont configurés dans Vite pour simplifier les imports côté frontend.

## Scripts Utiles

- `npm run dev`: Lance le serveur de développement Vite pour le frontend.
- `npm run start:backend`: Lance le serveur de développement Fastify pour le backend.
- `npm run build`: Compile le frontend pour la production.
- `npm run lint`: Exécute ESLint pour analyser le code.
