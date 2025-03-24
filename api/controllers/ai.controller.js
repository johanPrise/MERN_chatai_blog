import { nanoid } from 'nanoid';
import ConversationModel from '../models/Conversation.js';
import { aiService } from '../services/ai.service.js';

export const aiController = {
  // Send a message to the AI and get a response
  sendMessage: async (req, res) => {
    const { input, sessionId } = req.body;
    const newMessage = { sender: "user", content: input, timestamp: new Date() };
    
    try {
      let conversation = await ConversationModel.findOne({ sessionId });
      
      if (!conversation) {
        conversation = new ConversationModel({ 
          sessionId: sessionId || nanoid(), 
          messages: [] 
        });
      }
      
      // Temporarily add the new message to generate the response
      const tempMessages = [...conversation.messages, newMessage];
      
      // Get the model's response
      const aiResponse = await aiService.generateResponse(tempMessages);
      
      // Add the user message and model response to the conversation
      const botMessage = { sender: "model", content: aiResponse, timestamp: new Date() };
      
      conversation.messages.push(newMessage);
      conversation.messages.push(botMessage);
      
      // Save the updated conversation to the database
      await conversation.save();
      
      // Respond to the user with the model's response
      res.json({ response: aiResponse });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to get a response from the AI model." });
    }
  },
  
  // Get conversation history
  getConversation: async (req, res) => {
    const { sessionId } = req.params;
    
    try {
      const conversation = await ConversationModel.findOne({ sessionId });
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation history." });
    }
  },
  
  // Clear conversation history
  clearConversation: async (req, res) => {
    const { sessionId } = req.params;
    
    try {
      const conversation = await ConversationModel.findOne({ sessionId });
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      conversation.messages = [];
      await conversation.save();
      
      res.json({ message: 'Conversation cleared successfully' });
    } catch (error) {
      console.error("Error clearing conversation:", error);
      res.status(500).json({ error: "Failed to clear conversation history." });
    }
  }
};