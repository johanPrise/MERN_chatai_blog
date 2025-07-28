import React, { useEffect, useState } from 'react'
import { UserFriendlyError } from '../types/ErrorTypes'

interface ErrorNotificationProps {
  error: UserFriendlyError | null
  onClose: () => void
  autoClose?: boolean
  autoCloseDelay?: number
}

/**
 * Error notification component to display user-friendly error messages
 * Supports different error types with appropriate styling and actions
 */
const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (error) {
      setIsVisible(true)
      
      if (autoClose && error.type !== 'error') {
        const timer = setTimeout(() => {
          handleClose()
        }, autoCloseDelay)
        
        return () => clearTimeout(timer)
      }
    } else {
      setIsVisible(false)
    }
  }, [error, autoClose, autoCloseDelay])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Wait for animation to complete
  }

  const handleActionClick = () => {
    if (error?.action?.handler) {
      error.action.handler()
    }
    handleClose()
  }

  if (!error || !isVisible) {
    return null
  }

  const getIconAndColors = () => {
    switch (error.type) {
      case 'error':
        return {
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-200',
          iconColor: 'text-red-400 dark:text-red-300'
        }
      case 'warning':
        return {
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          iconColor: 'text-yellow-400 dark:text-yellow-300'
        }
      case 'info':
        return {
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-200',
          iconColor: 'text-blue-400 dark:text-blue-300'
        }
      default:
        return {
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'bg-gray-50 dark:bg-gray-800',
          borderColor: 'border-gray-200 dark:border-gray-700',
          textColor: 'text-gray-800 dark:text-gray-200',
          iconColor: 'text-gray-400 dark:text-gray-300'
        }
    }
  }

  const { icon, bgColor, borderColor, textColor, iconColor } = getIconAndColors()

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div
        className={`${bgColor} ${borderColor} ${textColor} border rounded-lg p-4 shadow-lg transform transition-all duration-300 ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${iconColor}`}>
            {icon}
          </div>
          
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">
              {error.message}
            </p>
            
            {error.code && (
              <p className="text-xs opacity-75 mt-1">
                Code: {error.code}
              </p>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleClose}
              className={`${iconColor} hover:opacity-75 transition-opacity`}
            >
              <span className="sr-only">Fermer</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {error.action && (
          <div className="mt-3">
            <button
              onClick={handleActionClick}
              className={`text-sm font-medium underline hover:no-underline transition-all ${
                error.type === 'error' 
                  ? 'text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200'
                  : error.type === 'warning'
                  ? 'text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200'
                  : 'text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200'
              }`}
            >
              {error.action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ErrorNotification