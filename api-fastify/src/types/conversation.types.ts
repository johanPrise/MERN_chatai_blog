/**
 * Interface pour un message dans une conversation
 */
export interface IMessage {
  content: string;
  sender: string;
}

/**
 * Interface pour une conversation
 */
export interface IConversation {
  messages: IMessage[];
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
}
