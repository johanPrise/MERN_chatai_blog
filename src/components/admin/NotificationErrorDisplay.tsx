import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { NotificationError } from '../../services/NotificationErrorHandler'

interface NotificationErrorDisplayProps {
  error: NotificationError
  onRetry?: () => void
  isRetrying?: boolean
  showRetryButton?: boolean
  connectionStatus?: 'online' | 'offline' | 'checking'
}

/**
 * Composant d'affichage d'erreurs avec boutons de retry
 * Requirement 2.2, 2.4: Messages d'erreur utilisateur et boutons retry
 */
const NotificationErrorDisplay: React.FC<NotificationErrorDisplayProps> = ({
  error,
  onRetry,
  isRetrying = false,
  showRetryButton = true,
  connectionStatus = 'online'
}) => {
  const getErrorIcon = () => {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return <WifiOff className="w-5 h-5 text-red-500" />
      case 'TIMEOUT_ERROR':
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      case 'SERVER_ERROR':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'online':
        return <Wifi className="w-4 h-4 text-green-500" />
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-500" />
      case 'checking':
        return (
          <motion.div
            className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )
    }
  }

  return (
    <motion.div
      className="px-4 py-6 text-center border-t border-gray-200 dark:border-gray-700"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center space-y-3">
        {getErrorIcon()}
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {error.userMessage}
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            {getConnectionIcon()}
            <span>
              {connectionStatus === 'online' ? 'Connecté' : 
               connectionStatus === 'offline' ? 'Hors ligne' : 'Vérification...'}
            </span>
          </div>
        </div>

        {showRetryButton && error.retryable && onRetry && (
          <motion.button
            onClick={onRetry}
            disabled={isRetrying}
            className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors ${
              isRetrying
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
            }`}
            whileHover={!isRetrying ? { scale: 1.02 } : {}}
            whileTap={!isRetrying ? { scale: 0.98 } : {}}
          >
            {isRetrying ? (
              <motion.div
                className="w-4 h-4 border border-gray-400 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{isRetrying ? 'Retry en cours...' : 'Réessayer'}</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

export default NotificationErrorDisplay