"use client"

import React, { useState, useEffect, useRef } from "react"
import { nanoid } from "nanoid"
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card"
import { cn } from "../lib/utils"
import { ChatMessage, ChatApiResponse } from "../types/ChatTypes"
import { ChatbotProps } from "../types/ChatbotProps"
import {
  formatChatMessage,
  formatMessageTime,
  saveMessagesToStorage,
  loadMessagesFromStorage,
  generateWelcomeMessage
} from "../lib/chatUtils"


/**
 * Chatbot component that allows users to interact with an AI model.
 *
 * @param {ChatbotProps} props - Component props
 * @returns {JSX.Element} The chatbot component
 */
const Chatbot: React.FC<ChatbotProps> = ({
  title = "Assistant IA",
  placeholder = "Tapez votre message...",
  apiEndpoint = "https://mern-backend-neon.vercel.app/send"
}) => {
  // State
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState<string>("")
  const [sessionId, setSessionId] = useState<string>(() => {
    const storedSessionId = localStorage.getItem("chatSessionId")
    return storedSessionId || nanoid()
  })
  const [isThinking, setIsThinking] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize session and load saved messages
  useEffect(() => {
    // Initialize session ID
    if (!localStorage.getItem("chatSessionId")) {
      const newSessionId = nanoid()
      setSessionId(newSessionId)
      localStorage.setItem("chatSessionId", newSessionId)

      // Add welcome message for new sessions
      const welcomeMsg = generateWelcomeMessage(nanoid())
      setMessages([welcomeMsg])
    } else {
      // Load saved messages
      const savedMessages = loadMessagesFromStorage()
      if (savedMessages.length > 0) {
        setMessages(savedMessages)
      } else {
        // Add welcome message if no saved messages
        const welcomeMsg = generateWelcomeMessage(nanoid())
        setMessages([welcomeMsg])
      }
    }
  }, [])

  // Save messages to localStorage when they change
  useEffect(() => {
    saveMessagesToStorage(messages)
  }, [messages])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    }
  }, [isOpen])

  /**
   * Toggle chat window open/closed
   */
  const toggleChat = () => {
    setIsOpen(!isOpen)
    setError(null)
  }

  /**
   * Format message text with Markdown-like syntax
   * @param {string} text - Raw message text
   * @returns {string} Formatted HTML
   */
  const formatMessage = (text: string): string => {
    return formatChatMessage(text)
  }

  /**
   * Send message to API and handle response
   */
  const handleSend = async () => {
    if (input.trim() === "") return

    // Clear error
    setError(null)

    // Create new message
    const newUserMessage: ChatMessage = {
      id: nanoid(),
      text: input,
      sender: "user",
      timestamp: new Date()
    }

    // Add user message to chat
    setMessages(prev => [...prev, newUserMessage])
    setInput("")
    setIsThinking(true)

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input, sessionId }),
      })

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`)
      }

      const data: ChatApiResponse = await response.json()

      // Create bot response message
      const botMessage: ChatMessage = {
        id: nanoid(),
        text: formatMessage(data.response),
        sender: "model",
        timestamp: new Date()
      }

      // Add bot message to chat
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setIsThinking(false)
    }
  }

  /**
   * Handle key press events
   * @param {React.KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  /**
   * Clear chat history
   */
  const clearChat = () => {
    setMessages([])
    localStorage.removeItem("chatMessages")
  }

  /**
   * Format timestamp for display
   * @param {Date} date - Message timestamp
   * @returns {string} Formatted time
   */
  const getMessageTime = (date: Date): string => {
    return formatMessageTime(date)
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Chat toggle button */}
      <Button
        onClick={toggleChat}
        variant="default"
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg bg-lime-600 hover:bg-lime-700 transition-all duration-300"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </Button>

      {/* Chat window */}
      <div
        className={cn(
          "mt-3 w-80 md:w-96 transition-all duration-300 transform",
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}
      >
        <Card className="border-lime-200 shadow-lg overflow-hidden h-[450px] flex flex-col">
          {/* Chat header */}
          <CardHeader className="bg-lime-600 text-white p-3 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <h3 className="font-medium text-sm">{title}</h3>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                className="h-7 w-7 rounded-full hover:bg-lime-700/50 text-white"
                title="Effacer la conversation"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Chat messages */}
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-3 p-6">
                <Bot className="h-12 w-12 text-lime-600 mb-2" />
                <p className="text-sm">Comment puis-je vous aider aujourd'hui ?</p>
                <p className="text-xs">Posez-moi une question sur le blog, les articles ou tout autre sujet.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%] rounded-lg p-3 animate-in fade-in-0 zoom-in-95 duration-300",
                    msg.sender === "user"
                      ? "ml-auto bg-lime-600 text-white rounded-br-none"
                      : "mr-auto bg-white dark:bg-gray-800 shadow-sm rounded-bl-none"
                  )}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge
                      variant={msg.sender === "user" ? "default" : "outline"}
                      className={cn(
                        "text-[10px] px-1 py-0 h-4",
                        msg.sender === "user"
                          ? "bg-lime-700"
                          : "bg-transparent text-lime-700 border-lime-200"
                      )}
                    >
                      {msg.sender === "user" ? "Vous" : "Assistant"}
                    </Badge>
                    <span className="text-[10px] opacity-70">{getMessageTime(msg.timestamp)}</span>
                  </div>
                  <div
                    className={cn(
                      "text-sm",
                      msg.sender === "model" && "dark:text-gray-200"
                    )}
                    dangerouslySetInnerHTML={{ __html: msg.text }}
                  />
                </div>
              ))
            )}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex max-w-[85%] mr-auto rounded-lg p-3 bg-white dark:bg-gray-800 shadow-sm rounded-bl-none animate-pulse">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-lime-600" />
                  <span className="text-sm text-gray-500">L'assistant réfléchit...</span>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex max-w-[85%] mx-auto rounded-lg p-3 bg-red-50 text-red-700 border border-red-200">
                <div className="text-sm">
                  <strong>Erreur:</strong> {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Chat input */}
          <CardFooter className="p-2 bg-white dark:bg-gray-800 border-t">
            <div className="flex w-full items-center space-x-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isThinking}
                className="flex-1 focus-visible:ring-lime-600"
              />
              <Button
                onClick={handleSend}
                disabled={isThinking || input.trim() === ""}
                size="icon"
                className="bg-lime-600 hover:bg-lime-700 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Chatbot
