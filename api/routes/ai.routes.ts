import { aiController } from '../controllers/ai.controller';

/**
 * Routes combinées pour l'interaction avec l'IA
 * Cette approche permet de réduire le nombre de fichiers de routes,
 * ce qui est important pour rester sous la limite des 12 fonctions serverless de Vercel Hobby
 */
const aiRoutes = (app: any) => {
  // Send a message to the AI and get a response
  app.post('/ai/send', aiController.sendMessage);

  // Get conversation history
  app.get('/ai/conversation/:sessionId', aiController.getConversation);

  // Clear conversation history
  app.delete('/ai/conversation/:sessionId', aiController.clearConversation);
};

export default aiRoutes;