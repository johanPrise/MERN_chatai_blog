import React, { useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, X, CheckCheck, Clock, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { AdminNotification, NotificationPanelProps } from "../../types/AdminNotification"
import NotificationErrorDisplay from "./NotificationErrorDisplay"
import { NotificationError } from "../../services/NotificationErrorHandler"
import { ConnectionStatus } from "../../services/ConnectionMonitor"

/**
 * Composant NotificationPanel amélioré
 * Requirements: 3.1, 3.4 - Design amélioré avec largeur et hauteur appropriées
 * 
 * Améliorations par rapport à l'ancien système:
 * - Largeur augmentée de 320px à 400px
 * - Hauteur maximale améliorée avec meilleur scroll
 * - Gestion des états (chargement, erreur)
 * - Structure modulaire pour faciliter les améliorations futures
 */
const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  isLoading = false,
  error = null,
  onRetry,
  connectionStatus = 'online'
}) => {
  const unreadCount = notifications.filter(n => !n.read).length
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = React.useState(false)
  const [clickedNotifications, setClickedNotifications] = React.useState<Set<string>>(new Set())
  const [showScrollToTop, setShowScrollToTop] = React.useState(false)

  /**
   * Gère le scroll automatique vers le haut lors de l'ouverture
   * Requirements: 3.4 - Gestion du scroll pour les longues listes
   */
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
      setShowScrollToTop(false)
    }
  }, [isOpen])

  /**
   * Gère l'affichage du bouton scroll to top
   */
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const handleScroll = () => {
      setShowScrollToTop(scrollContainer.scrollTop > 100)
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [isOpen])

  /**
   * Fonction pour scroller vers le haut
   */
  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  /**
   * Gère les raccourcis clavier
   * Requirements: 3.4 - Amélioration de l'accessibilité
   */
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            if (unreadCount > 0) {
              handleMarkAllAsRead()
            }
          }
          break
        case 'ArrowUp':
        case 'ArrowDown':
          // Permettre la navigation au clavier dans la liste
          e.preventDefault()
          // Cette fonctionnalité pourrait être étendue pour la navigation entre notifications
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, unreadCount, onClose])

  /**
   * Gère le clic sur une notification
   * Requirements: 2.2, 2.3 - Marquer comme lu et navigation
   */
  const handleNotificationClick = async (notification: AdminNotification) => {
    // Éviter les clics multiples
    if (clickedNotifications.has(notification.id)) {
      return
    }

    try {
      setClickedNotifications(prev => new Set(prev).add(notification.id))

      // Marquer la notification comme lue si elle ne l'est pas déjà
      if (!notification.read) {
        await onMarkAsRead(notification.id)
      }

      // Appeler le callback de clic pour permettre la navigation
      onNotificationClick(notification)

      // Si une actionUrl est définie, naviguer vers cette URL
      if (notification.actionUrl) {
        // Utiliser window.location pour la navigation ou router selon le contexte
        if (notification.actionUrl.startsWith('http')) {
          // URL externe
          window.open(notification.actionUrl, '_blank', 'noopener,noreferrer')
        } else {
          // URL interne - utiliser l'historique du navigateur
          window.location.href = notification.actionUrl
        }
      }
    } catch (error) {
      console.error('Erreur lors du clic sur la notification:', error)
      // Toujours appeler le callback même en cas d'erreur
      onNotificationClick(notification)
    } finally {
      // Permettre de nouveau les clics après un délai
      setTimeout(() => {
        setClickedNotifications(prev => {
          const newSet = new Set(prev)
          newSet.delete(notification.id)
          return newSet
        })
      }, 1000)
    }
  }

  /**
   * Gère le bouton "Marquer toutes comme lues"
   * Requirements: 2.4 - Marquage en masse des notifications
   */
  const handleMarkAllAsRead = async () => {
    if (isMarkingAllAsRead || unreadCount === 0) {
      return
    }

    try {
      setIsMarkingAllAsRead(true)
      await onMarkAllAsRead()
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error)
      // Optionnel: afficher un message d'erreur à l'utilisateur
    } finally {
      setIsMarkingAllAsRead(false)
    }
  }

  /**
   * Obtient l'icône appropriée selon le type de notification
   */
  const getNotificationIcon = (type: AdminNotification['type'], priority: AdminNotification['priority']) => {
    const iconClass = "w-4 h-4 flex-shrink-0"
    
    switch (type) {
      case 'system_error':
        return <AlertCircle className={`${iconClass} text-red-500`} />
      case 'user_registered':
        return <Info className={`${iconClass} text-blue-500`} />
      case 'post_published':
        return <Info className={`${iconClass} text-green-500`} />
      case 'content_moderation':
        return <AlertTriangle className={`${iconClass} text-orange-500`} />
      case 'user_activity':
        return <Info className={`${iconClass} text-purple-500`} />
      default:
        return <Bell className={`${iconClass} text-gray-500`} />
    }
  }

  /**
   * Obtient la classe CSS pour la priorité de la notification
   */
  const getPriorityClass = (priority: AdminNotification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-red-500 shadow-red-100 dark:shadow-red-900/20'
      case 'medium':
        return 'border-l-4 border-orange-500 shadow-orange-100 dark:shadow-orange-900/20'
      case 'low':
        return 'border-l-4 border-blue-500 shadow-blue-100 dark:shadow-blue-900/20'
      default:
        return 'border-l-4 border-gray-300 dark:border-gray-600'
    }
  }

  /**
   * Formate la date de la notification
   */
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 7) return `Il y a ${days}j`
    return timestamp.toLocaleDateString()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed top-16 right-4 w-[480px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 origin-top-right"
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Header du panneau - style similaire au header principal */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <motion.span 
                  className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium leading-none text-white bg-red-600 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  {unreadCount}
                </motion.span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <motion.button
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAllAsRead}
                  className={`text-xs flex items-center space-x-1 px-2 py-1 rounded transition-colors duration-200 ${
                    isMarkingAllAsRead 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                  whileHover={!isMarkingAllAsRead ? { scale: 1.02 } : {}}
                  whileTap={!isMarkingAllAsRead ? { scale: 0.98 } : {}}
                  title={isMarkingAllAsRead ? "Marquage en cours..." : "Marquer toutes comme lues"}
                >
                  {isMarkingAllAsRead ? (
                    <motion.div
                      className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <CheckCheck className="w-3 h-3" />
                  )}
                  <span>Tout lire</span>
                </motion.button>
              )}
              
              <motion.button
                onClick={onClose}
                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Fermer"
              >
                <X className="w-3 h-3" />
              </motion.button>
            </div>
          </div>

          {/* Contenu du panneau - style similaire aux dropdowns du header principal */}
          <div 
            ref={scrollContainerRef}
            className="max-h-[500px] overflow-y-auto"
          >
            {/* État de chargement */}
            {isLoading && (
              <motion.div 
                className="px-4 py-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Chargement...
                </p>
              </motion.div>
            )}

            {/* État d'erreur */}
            {error && !isLoading && (
              <NotificationErrorDisplay
                error={typeof error === 'string' ? {
                  code: 'UNKNOWN_ERROR',
                  message: error,
                  userMessage: error,
                  retryable: true
                } as NotificationError : error}
                onRetry={onRetry}
                connectionStatus={connectionStatus}
              />
            )}

            {/* Liste des notifications - style similaire aux DropdownMenuItem */}
            {!isLoading && !error && (
              <>
                {notifications.length === 0 ? (
                  <motion.div 
                    className="px-4 py-6 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <Bell className="w-6 h-6 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Aucune notification
                    </p>
                  </motion.div>
                ) : (
                  <div className="py-1">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        className={`mx-2 mb-2 px-4 py-3 rounded-md transition-all duration-200 cursor-pointer ${
                          clickedNotifications.has(notification.id)
                            ? "bg-gray-100 dark:bg-gray-700 opacity-75 cursor-wait"
                            : !notification.read 
                              ? "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30" 
                              : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05, ease: "easeOut" }}
                        onClick={() => handleNotificationClick(notification)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleNotificationClick(notification)
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Notification: ${notification.title}. ${!notification.read ? 'Non lue' : 'Lue'}. ${notification.actionUrl ? 'Cliquez pour naviguer.' : ''}`}
                      >
                        <div className="flex items-start space-x-4">
                          {/* Icône de type */}
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type, notification.priority)}
                          </div>
                          
                          {/* Contenu de la notification */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h4 className={`text-sm font-semibold leading-5 ${
                                !notification.read 
                                  ? "text-gray-900 dark:text-white" 
                                  : "text-gray-700 dark:text-gray-200"
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1 ml-3" />
                              )}
                            </div>
                            
                            <p className={`text-sm mt-2 leading-5 line-clamp-3 ${
                              !notification.read 
                                ? "text-gray-600 dark:text-gray-300" 
                                : "text-gray-500 dark:text-gray-400"
                            }`}>
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              
                              <div className="flex items-center space-x-2">
                                {notification.priority === 'high' && (
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/50 rounded-full">
                                    Urgent
                                  </span>
                                )}
                                {notification.actionUrl && (
                                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                    →
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

          </div>

          {/* Footer simple - style similaire au header principal */}
          {notifications.length > 0 && !isLoading && !error && (
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 rounded-b-lg">
              <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                {notifications.length} notification{notifications.length > 1 ? 's' : ''}
                {unreadCount > 0 && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    • {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default NotificationPanel