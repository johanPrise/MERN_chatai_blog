# Requirements Document

## Introduction

Ce document définit les requirements pour corriger les problèmes critiques du blog qui affectent l'expérience utilisateur et les fonctionnalités essentielles. Les problèmes incluent le système de likes défaillant, les redirections incorrectes, l'affichage des images, les problèmes de responsive design, et les dysfonctionnements de l'éditeur de posts.

## Requirements

### Requirement 1: Système de Likes Fonctionnel

**User Story:** En tant qu'utilisateur, je veux pouvoir liker et disliker les posts et commentaires, et que ces actions soient sauvegardées de manière persistante, afin de pouvoir exprimer mon opinion et la retrouver lors de mes prochaines visites.

#### Acceptance Criteria

1. WHEN un utilisateur clique sur le bouton like d'un post THEN le système SHALL enregistrer le like en base de données ET mettre à jour l'interface utilisateur
2. WHEN un utilisateur clique sur le bouton dislike d'un post THEN le système SHALL enregistrer le dislike en base de données ET mettre à jour l'interface utilisateur
3. WHEN un utilisateur clique sur le bouton like d'un commentaire THEN le système SHALL enregistrer le like en base de données ET maintenir l'état visuel après rechargement de la page
4. WHEN un utilisateur clique sur le bouton dislike d'un commentaire THEN le système SHALL enregistrer le dislike en base de données ET maintenir l'état visuel après rechargement de la page
5. WHEN un utilisateur a déjà liké un post ou commentaire THEN le système SHALL empêcher les likes multiples du même utilisateur
6. WHEN la page est rechargée THEN les états des likes et dislikes SHALL être correctement affichés selon les données sauvegardées

### Requirement 2: Création de Posts et Navigation

**User Story:** En tant qu'utilisateur créateur, je veux pouvoir créer un post et être redirigé vers une page valide après la création, afin de voir mon post publié ou continuer mon workflow de création.

#### Acceptance Criteria

1. WHEN un utilisateur soumet un nouveau post THEN le système SHALL créer le post en base de données ET rediriger vers la page du post créé
2. WHEN la création d'un post échoue THEN le système SHALL afficher un message d'erreur clair ET maintenir l'utilisateur sur la page de création
3. WHEN un post est créé avec succès THEN l'URL de redirection SHALL être valide et accessible
4. WHEN un utilisateur accède à une page de post THEN l'URL SHALL correspondre à un post existant OU afficher une page 404 appropriée

### Requirement 3: Gestion des Brouillons

**User Story:** En tant qu'administrateur ou créateur, je veux avoir accès à une page dédiée pour visualiser et gérer tous les brouillons sauvegardés, afin de pouvoir les modifier, publier ou supprimer selon mes besoins.

#### Acceptance Criteria

1. WHEN un administrateur accède à la section brouillons THEN le système SHALL afficher tous les brouillons existants avec leurs métadonnées
2. WHEN un créateur accède à la section brouillons THEN le système SHALL afficher uniquement ses propres brouillons
3. WHEN un utilisateur non-autorisé tente d'accéder aux brouillons THEN le système SHALL refuser l'accès ET rediriger vers une page d'erreur appropriée
4. WHEN un brouillon est sélectionné THEN l'utilisateur SHALL pouvoir l'éditer, le publier ou le supprimer
5. WHEN la page des brouillons est chargée THEN elle SHALL être accessible uniquement aux administrateurs et créateurs authentifiés

### Requirement 4: Affichage des Images

**User Story:** En tant qu'utilisateur, je veux que toutes les images des posts s'affichent correctement, qu'elles soient stockées localement ou référencées par URL, afin de pouvoir voir le contenu complet des articles.

#### Acceptance Criteria

1. WHEN un post contient des images stockées physiquement THEN ces images SHALL s'afficher correctement dans le post
2. WHEN un post contient des images référencées par URL THEN ces images SHALL se charger et s'afficher correctement
3. WHEN une image ne peut pas être chargée THEN le système SHALL afficher un placeholder ou message d'erreur approprié
4. WHEN les images sont affichées THEN elles SHALL être responsive et s'adapter à la taille de l'écran
5. WHEN un utilisateur upload une image THEN elle SHALL être correctement sauvegardée ET accessible via son URL

### Requirement 5: Expérience Mobile Responsive

**User Story:** En tant qu'utilisateur mobile, je veux pouvoir lire tous les posts sans avoir besoin de scroller horizontalement, afin d'avoir une expérience de lecture confortable sur mon appareil.

#### Acceptance Criteria

1. WHEN un utilisateur mobile accède à un post THEN le contenu SHALL s'afficher entièrement dans la largeur de l'écran
2. WHEN le contenu d'un post est trop large THEN il SHALL automatiquement s'adapter à la largeur de l'écran mobile
3. WHEN des éléments comme les tableaux ou code sont présents THEN ils SHALL être responsive OU avoir un scroll vertical uniquement
4. WHEN un utilisateur fait défiler un post sur mobile THEN le scroll SHALL être uniquement vertical
5. WHEN les images sont affichées sur mobile THEN elles SHALL s'adapter à la largeur de l'écran

### Requirement 6: Éditeur de Posts Stable

**User Story:** En tant que créateur, je veux pouvoir modifier mes posts dans un éditeur stable qui préserve la mise en forme originale, afin de pouvoir faire des corrections sans altérer la structure du contenu.

#### Acceptance Criteria

1. WHEN un utilisateur ouvre un post en mode édition THEN le contenu SHALL s'afficher correctement formaté dans l'éditeur
2. WHEN l'éditeur charge un post THEN la mise en forme originale SHALL être préservée
3. WHEN un utilisateur modifie un post THEN les changements SHALL être appliqués sans altérer les éléments non modifiés
4. WHEN une erreur survient lors de la modification THEN le message d'erreur SHALL être clair et spécifique
5. WHEN un post est sauvegardé THEN la numérotation des listes SHALL être préservée correctement
6. WHEN un post contient des titres H1, H2, etc. THEN ils SHALL maintenir leur niveau hiérarchique après modification

### Requirement 7: Préservation du Summary

**User Story:** En tant que créateur, je veux que le summary de mon post soit préservé et visible lors de l'édition, afin de pouvoir le modifier si nécessaire sans le perdre.

#### Acceptance Criteria

1. WHEN un utilisateur ouvre un post en mode édition THEN le summary SHALL être visible et éditable
2. WHEN un post est sauvegardé THEN le summary SHALL être préservé s'il n'a pas été modifié
3. WHEN le summary est modifié THEN les changements SHALL être sauvegardés correctement
4. WHEN un post sans summary est édité THEN l'utilisateur SHALL pouvoir ajouter un summary

### Requirement 8: Système de Thème Fonctionnel

**User Story:** En tant qu'utilisateur, je veux pouvoir changer le thème de couleur de l'interface et que ce changement s'applique à toute l'application, afin de personnaliser mon expérience visuelle.

#### Acceptance Criteria

1. WHEN un utilisateur clique sur le bouton de changement de thème THEN le thème SHALL s'appliquer à toute l'interface
2. WHEN le thème est changé THEN la préférence SHALL être sauvegardée pour les prochaines visites
3. WHEN la page est rechargée THEN le thème sélectionné SHALL être maintenu
4. WHEN le thème sombre est activé THEN tous les composants SHALL utiliser les couleurs appropriées du thème sombre
5. WHEN le thème clair est activé THEN tous les composants SHALL utiliser les couleurs appropriées du thème clair

### Requirement 9: Filtrage de Contenu

**User Story:** En tant qu'administrateur, je veux que le système filtre automatiquement les mots inappropriés dans les posts et commentaires, afin de maintenir un environnement respectueux sur la plateforme.

#### Acceptance Criteria

1. WHEN un utilisateur soumet un post contenant des mots inappropriés THEN le système SHALL les détecter ET les remplacer par des alternatives appropriées
2. WHEN un commentaire contient des mots inappropriés THEN le système SHALL les filtrer avant publication
3. WHEN du contenu filtré est affiché THEN les mots inappropriés SHALL être masqués ou remplacés
4. WHEN un administrateur configure les filtres THEN il SHALL pouvoir ajouter ou retirer des mots de la liste de filtrage
5. WHEN le filtrage est appliqué THEN l'utilisateur SHALL être informé que son contenu a été modifié

### Requirement 10: Correction des Problèmes de Scroll

**User Story:** En tant qu'utilisateur, je veux que les composants de l'interface n'aient pas de barres de scroll indésirables, afin d'avoir une expérience de navigation fluide et propre.

#### Acceptance Criteria

1. WHEN un composant est affiché THEN il SHALL s'adapter à son conteneur sans créer de scroll horizontal indésirable
2. WHEN le contenu d'un composant dépasse sa taille THEN le scroll SHALL être géré de manière appropriée (vertical uniquement si nécessaire)
3. WHEN plusieurs composants sont affichés THEN aucun ne SHALL avoir de scroll conflictuel avec le scroll principal de la page
4. WHEN l'interface est redimensionnée THEN les composants SHALL s'adapter sans créer de problèmes de scroll
5. WHEN un utilisateur navigue dans l'application THEN l'expérience SHALL être fluide sans scrolls parasites