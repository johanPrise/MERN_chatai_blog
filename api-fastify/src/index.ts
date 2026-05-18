import { config } from 'dotenv';
import { buildServer } from './server.js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { fileURLToPath } from 'node:url';
import type { OutgoingHttpHeaders } from 'node:http';

// Charger les variables d'environnement
config();

// Instance de serveur pour Vercel
let server: Awaited<ReturnType<typeof buildServer>> | null = null;

type InjectResponse = {
  headers: OutgoingHttpHeaders;
  statusCode: number;
  payload: string;
};

type InjectMethod =
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'PATCH'
  | 'POST'
  | 'PUT'
  | 'OPTIONS';

const toInjectMethod = (method?: string): InjectMethod => {
  switch (method) {
    case 'DELETE':
    case 'GET':
    case 'HEAD':
    case 'PATCH':
    case 'POST':
    case 'PUT':
    case 'OPTIONS':
      return method;
    default:
      return 'GET';
  }
};

const injectRequest = (
  serverInstance: Awaited<ReturnType<typeof buildServer>>,
  req: VercelRequest
): Promise<InjectResponse> => {
  return new Promise((resolve, reject) => {
    serverInstance.inject({
      method: toInjectMethod(req.method),
      url: req.url,
      headers: req.headers,
      payload: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response) {
        reject(new Error('Fastify did not return an inject response'));
        return;
      }

      resolve(response);
    });
  });
};

// Function pour démarrer le serveur (pour le développement local)
const startServer = async () => {
  try {
    const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 4200;
    const serverInstance = await buildServer();

    await serverInstance.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Serveur en écoute sur le port ${PORT}`);
  } catch (error) {
    console.error('Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

// Handler pour Vercel (serverless)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Initialiser le serveur Fastify si ce n'est pas déjà fait
    if (!server) {
      server = await buildServer();
      await server.ready();
    }

    // Injecter la requête dans Fastify
    const response = await injectRequest(server, req);

    // Définir les en-têtes de réponse
    Object.entries(response.headers).forEach(([key, value]) => {
      if (value !== undefined) {
        res.setHeader(key, value);
      }
    });

    // Définir le statut de réponse
    res.status(response.statusCode);

    // Envoyer la réponse
    res.end(response.payload);
  } catch (error) {
    console.error('Error in Vercel handler:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

// Pour le développement local
if (process.env.NODE_ENV !== 'production' && isMainModule) {
  // Gérer les erreurs non capturées
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  // Démarrer le serveur
  startServer();
}
