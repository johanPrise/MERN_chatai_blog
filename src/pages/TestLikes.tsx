import React from 'react';
import LikesTestComponent from '../components/LikesTestComponent';
import { Container } from '../components/ui/container';

const TestLikesPage: React.FC = () => {
  return (
    <Container>
      <div className="py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Test du système de Likes/Dislikes
        </h1>
        
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Instructions</h2>
          <p className="text-sm text-gray-700">
            Cette page teste les endpoints de likes/dislikes pour les posts et commentaires.
            Les tests utilisent un ID fictif pour vérifier que les routes existent et sont accessibles.
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
            <li><strong>200</strong> : Endpoint accessible (même si l'ID n'existe pas, la route fonctionne)</li>
            <li><strong>401/403</strong> : Authentification requise (normal si pas connecté)</li>
            <li><strong>404</strong> : Route non trouvée (problème de configuration)</li>
            <li><strong>0</strong> : Erreur de connexion</li>
          </ul>
        </div>
        
        <LikesTestComponent />
      </div>
    </Container>
  );
};

export default TestLikesPage;