export interface IMessage {
    sender: 'user' | 'model';
    content: string;
    timestamp: Date;
  }
  
  export interface IConversation {
    sessionId: string;
    messages: IMessage[];
  }