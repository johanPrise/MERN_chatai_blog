import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';

/**
 * Props for the ApiConnectionTest component
 */
interface ApiConnectionTestProps {
  /** The API endpoint to test */
  endpoint?: string;
  /** Optional title for the component */
  title?: string;
  /** Optional className for styling */
  className?: string;
}

/**
 * Component that tests the connection to the backend API
 */
const ApiConnectionTest: React.FC<ApiConnectionTestProps> = ({
  endpoint = '/api/health',
  title = 'Test de connexion API',
  className = '',
}) => {
  // State
  const [status, setStatus] = useState<string>('Vérification de la connexion...');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check API connection on component mount
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const response = await axios.get(endpoint);
        
        if (response.status === 200) {
          setStatus('Connecté au backend avec succès!');
        } else {
          setStatus(`Réponse inattendue du backend: ${response.status}`);
        }
      } catch (err) {
        setStatus('Échec de la connexion au backend');
        
        // Type guard for AxiosError
        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError;
          setError(axiosError.message || 'Erreur inconnue');
        } else {
          setError((err as Error).message || 'Erreur inconnue');
        }
      } finally {
        setLoading(false);
      }
    };

    checkApiConnection();
  }, [endpoint]);

  return (
    <div className={`p-4 border rounded-lg mb-4 ${className}`}>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-lime-500 mr-2"></div>
          <p className="text-gray-600">Vérification en cours...</p>
        </div>
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
