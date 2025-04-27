# Guide de contribution

Merci de votre intérêt pour contribuer à ce projet ! Voici quelques lignes directrices pour vous aider à contribuer efficacement.

## Processus de développement

1. Créez une branche à partir de `main` pour votre fonctionnalité ou correction de bug
2. Nommez votre branche de manière descriptive (ex: `feature/user-authentication` ou `fix/login-error`)
3. Développez votre fonctionnalité ou correction
4. Assurez-vous que les tests passent
5. Soumettez une Pull Request vers la branche `main`

## Standards de code

- Suivez les règles ESLint et Prettier configurées dans le projet
- Écrivez des tests pour les nouvelles fonctionnalités
- Documentez les nouvelles fonctionnalités ou les changements importants
- Utilisez TypeScript pour tout nouveau code

## Structure du projet

Respectez la structure existante du projet :

- `/api` : Backend (Express/Node.js/TypeScript)
- `/src` : Frontend (React/TypeScript)

### Backend (`/api`)

- `/config` : Configuration de l'application
- `/controllers` : Contrôleurs pour gérer les requêtes
- `/middlewares` : Middlewares Express
- `/models` : Modèles Mongoose
- `/routes` : Routes Express
- `/services` : Services métier
- `/types` : Types TypeScript

### Frontend (`/src`)

- `/components` : Composants React réutilisables
- `/contexts` : Contextes React
- `/hooks` : Hooks personnalisés
- `/lib` : Utilitaires et fonctions
- `/pages` : Composants de page
- `/styles` : Styles globaux
- `/types` : Types TypeScript

## Commits

- Utilisez des messages de commit clairs et descriptifs
- Suivez le format : `type(scope): description` (ex: `feat(auth): add login page`)
- Types courants : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Pull Requests

- Décrivez clairement les changements apportés
- Référencez les issues concernées
- Assurez-vous que tous les tests passent
- Demandez une revue de code

## Questions

Si vous avez des questions, n'hésitez pas à ouvrir une issue ou à contacter les mainteneurs du projet.
