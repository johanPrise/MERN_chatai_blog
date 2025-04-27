import { ChatMessage } from "../types/ChatTypes"

/**
 * Format message text with Markdown-like syntax
 * @param {string} text - Raw message text
 * @returns {string} Formatted HTML
 */
export function formatChatMessage(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
    .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic
    .replace(/`(.*?)`/g, "<code class='bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono'>$1</code>") // Code
    .replace(/```(.*?)```/gs, "<pre class='bg-gray-100 dark:bg-gray-800 p-2 rounded my-2 overflow-x-auto text-sm font-mono'>$1</pre>") // Code block
    .replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank' rel='noopener noreferrer' class='text-lime-600 hover:underline'>$1</a>") // Links
    .replace(/\n/g, "<br />") // Line breaks
}

/**
 * Format timestamp for display
 * @param {Date} date - Message timestamp
 * @returns {string} Formatted time
 */
export function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Save messages to local storage
 * @param {ChatMessage[]} messages - Messages to save
 */
export function saveMessagesToStorage(messages: ChatMessage[]): void {
  if (messages.length > 0) {
    localStorage.setItem("chatMessages", JSON.stringify(messages))
  }
}

/**
 * Load messages from local storage
 * @returns {ChatMessage[]} Loaded messages or empty array
 */
export function loadMessagesFromStorage(): ChatMessage[] {
  const savedMessages = localStorage.getItem("chatMessages")
  if (savedMessages) {
    try {
      const parsedMessages = JSON.parse(savedMessages)
      // Convert string timestamps back to Date objects
      return parsedMessages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    } catch (err) {
      console.error("Error loading saved messages:", err)
    }
  }
  return []
}

/**
 * Generate a welcome message
 * @returns {ChatMessage} Welcome message
 */
export function generateWelcomeMessage(id: string): ChatMessage {
  return {
    id,
    text: "Bonjour ! Je suis l'assistant IA du blog. Comment puis-je vous aider aujourd'hui ?",
    sender: "model",
    timestamp: new Date()
  }
}
