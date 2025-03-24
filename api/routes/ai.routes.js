import { aiController } from '../controllers/ai.controller.js';

const aiRoutes = (app) => {
  // Send a message to the AI and get a response
  app.post('/send', aiController.sendMessage);
  
  // Get conversation history
  app.get('/conversation/:sessionId', aiController.getConversation);
  
  // Clear conversation history
  app.delete('/conversation/:sessionId', aiController.clearConversation);
};

export default aiRoutes;