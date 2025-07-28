import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/api.config';

interface TestResult {
  endpoint: string;
  status: number;
  success: boolean;
  message: string;
  data?: any;
}

const LikesTestComponent: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testEndpoint = async (endpoint: string, description: string) => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      addResult({
        endpoint: description,
        status: response.status,
        success: response.ok,
        message: data.message || 'No message',
        data: data
      });
    } catch (error) {
      addResult({
        endpoint: description,
        status: 0,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    clearResults();
    
    // Test avec un ID fictif pour vérifier que les routes existent
    const testId = '507f1f77bcf86cd799439011'; // ID MongoDB valide mais fictif
    
    await testEndpoint(API_ENDPOINTS.posts.like(testId), 'POST /posts/:id/like');
    await testEndpoint(API_ENDPOINTS.posts.dislike(testId), 'POST /posts/:id/dislike');
    await testEndpoint(API_ENDPOINTS.comments.like(testId), 'POST /comments/:id/like');
    await testEndpoint(API_ENDPOINTS.comments.dislike(testId), 'POST /comments/:id/dislike');
    
    setIsLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Test des endpoints Likes/Dislikes</h2>
      
      <div className="mb-4">
        <button
          onClick={runAllTests}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isLoading ? 'Test en cours...' : 'Lancer les tests'}
        </button>
        
        <button
          onClick={clearResults}
          className="ml-2 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Effacer les résultats
        </button>
      </div>

      <div className="space-y-2">
        {results.map((result, index) => (
          <div
            key={index}
            className={`p-3 rounded border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : result.status === 401 || result.status === 403
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{result.endpoint}</span>
              <span className={`px-2 py-1 rounded text-sm ${
                result.success 
                  ? 'bg-green-100 text-green-800'
                  : result.status === 401 || result.status === 403
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {result.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {result.message}
            </div>
            {result.data && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-blue-600">
                  Voir les données
                </summary>
                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && !isLoading && (
        <div className="text-gray-500 text-center py-8">
          Aucun test exécuté. Cliquez sur "Lancer les tests" pour commencer.
        </div>
      )}
    </div>
  );
};

export default LikesTestComponent;