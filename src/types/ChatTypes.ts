/**
 * Types for the chatbot component
 */

/**
 * Message sender type
 */
export type MessageSender = "user" | "model"

/**
 * Chat message interface
 */
export interface ChatMessage {
  id: string
  text: string
  sender: MessageSender
  timestamp: Date
}

/**
 * Chat session interface
 */
export interface ChatSession {
  id: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

/**
 * API response interface
 */
export interface ChatApiResponse {
  response: string
  sessionId: string
  success: boolean
  error?: string
}
