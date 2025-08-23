import React from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface MessageProps {
  message: string | null
  onDismiss: () => void
}

export const ErrorMessage: React.FC<MessageProps> = ({ message, onDismiss }) => {
  if (!message) return null

  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
      <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-red-800 text-sm font-medium">{message}</p>
        <button
          onClick={onDismiss}
          className="text-xs text-red-600 hover:text-red-800 mt-1"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}

export const SuccessMessage: React.FC<MessageProps> = ({ message, onDismiss }) => {
  if (!message) return null

  return (
    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-green-800 text-sm font-medium">{message}</p>
        <button
          onClick={onDismiss}
          className="text-xs text-green-600 hover:text-green-800 mt-1"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}