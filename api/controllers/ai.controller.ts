import { nanoid } from 'nanoid';
import ConversationModel from '../models/Conversation';
import { aiService } from '../services/ai.service';
import { Request, Response } from 'express';
import { IConversation, IMessage } from '../types/Conversation';

export const aiController = {
  // Send a message to the AI and get a response
  sendMessage: async (req: Request, res: Response) => {
    const { input, sessionId } = req.body as unknown as { input: string; sessionId: string };
    const newMessage: IMessage = { sender: "user", content: input, timestamp: new Date() };

    try {
      let conversation = await ConversationModel.findOne({ sessionId }) as IConversation | null;

      if (!conversation) {
        // Créer une nouvelle conversation avec un ID de session généré si non fourni
        const newSessionId = sessionId || nanoid();
        conversation = new ConversationModel({
          sessionId: newSessionId,
          messages: []
        }) as IConversation;
      }

      // Temporarily add the new message to generate the response
      const tempMessages: IMessage[] = [...conversation.messages, newMessage];

      // Get the model's response
      const aiResponse = await aiService.generateResponse(tempMessages);

      // Add the user message and model response to the conversation
      const botMessage: IMessage = { sender: "model", content: aiResponse, timestamp: new Date() };

      conversation.messages.push(newMessage);
      conversation.messages.push(botMessage);

      // Save the updated conversation to the database
      await (conversation as any).save();

      // Respond to the user with the model's response
      res.json({ response: aiResponse });
    } catch (error) {
      console.error("Error generating AI response:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Failed to get a response from the AI model.",
        details: errorMessage
      });
    }
  },

  // Get conversation history
  getConversation: async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    try {
      const conversation = await ConversationModel.findOne({ sessionId }) as IConversation | null;

      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Failed to fetch conversation history.",
        details: errorMessage
      });
    }
  },

  // Clear conversation history
  clearConversation: async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    try {
      const conversation = await ConversationModel.findOne({ sessionId }) as IConversation | null;

      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      (conversation as any).messages = [];
      await (conversation as any).save();

      res.json({ message: 'Conversation cleared successfully' });
    } catch (error) {
      console.error("Error clearing conversation:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Failed to clear conversation history.",
        details: errorMessage
      });
    }
  }
};