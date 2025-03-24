import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApiConnectionTest = () => {
  const [status, setStatus] = useState('Vérification de la connexion...');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        // Remplacez '/api/health' par une route de votre API qui renvoie une réponse simple
        const response = await axios.get('/api/health');
        
        if (response.status === 200) {
          setStatus('Connecté au backend avec succès!');
        } else {
          setStatus(`Réponse inattendue du backend: ${response.status}`);
        }
      } catch (err) {
        setStatus('Échec de la connexion au backend');
        setError(err.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    checkApiConnection();
  }, []);

  return (
    <div className="p-4 border rounded-lg mb-4">
      <h2 className="text-xl font-bold mb-2">Test de connexion API</h2>
      
      {loading ? (
        <p className="text-gray-600">Vérification en cours...</p>
      ) : (
        <>
          <p className={`text-lg ${error ? 'text-red-600' : 'text-green-600'}`}>
            {status}
          </p>
          
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800">Détails de l'erreur:</p>
              <pre className="text-sm overflow-auto mt-1">{error}</pre>
            </div>
          )}
          
          <p className="mt-2 text-sm text-gray-600">
            {error 
              ? "Conseil: Vérifiez que votre backend est en cours d'exécution et que votre proxy Vite est correctement configuré."
              : "Tout est bien configuré! Le frontend et le backend communiquent correctement."}
          </p>
        </>
      )}
    </div>
  );
};

export default ApiConnectionTest;