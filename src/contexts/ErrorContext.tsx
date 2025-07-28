import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { UserFriendlyError } from '../types/ErrorTypes'
import ErrorNotification from '../components/ErrorNotification'

interface ErrorContextType {
  showError: (error: UserFriendlyError) => void
  clearError: () => void
  currentError: UserFriendlyError | null
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

interface ErrorProviderProps {
  children: ReactNode
}

/**
 * Global error context provider for managing application-wide error state
 * Provides centralized error display and management
 */
export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [currentError, setCurrentError] = useState<UserFriendlyError | null>(null)

  const showError = useCallback((error: UserFriendlyError) => {
    setCurrentError(error)
  }, [])

  const clearError = useCallback(() => {
    setCurrentError(null)
  }, [])

  const contextValue: ErrorContextType = {
    showError,
    clearError,
    currentError
  }

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      <ErrorNotification
        error={currentError}
        onClose={clearError}
        autoClose={true}
        autoCloseDelay={5000}
      />
    </ErrorContext.Provider>
  )
}

/**
 * Hook to access error context
 * @throws {Error} If used outside of ErrorProvider
 */
export const useErrorContext = (): ErrorContextType => {
  const context = useContext(ErrorContext)
  
  if (context === undefined) {
    throw new Error('useErrorContext must be used within an ErrorProvider')
  }
  
  return context
}