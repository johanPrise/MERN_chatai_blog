import React, { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { UserContext } from "../UserContext"
import { ThemeToggle } from "./ui/theme-toggle"
import { API_ENDPOINTS } from "../config/api.config"
import {
  Bell,
  User,
  LogOut,
  Home,
  Users,
  BarChart2,
  Menu,
  X,
  ChevronDown,
  Settings,
  Clock,
  CheckCheck,
  AlertCircle,
  Info,
  AlertTriangle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AdminNotification } from "../types/AdminNotification"
import { NotificationService } from "../services/NotificationService"
import { NotificationApiClient } from "../services/NotificationApiClient"
import NotificationPanel from "./admin/NotificationPanel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

interface AdminHeaderProps {
  activeTab: "users" | "statistics"
  onTabChange: (tab: "users" | "statistics") => void
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, onTabChange }) => {
  const { userInfo, setUserInfo } = UserContext()
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isUserMenuOpen, setUserMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [isNotificationsOpen, setNotificationsOpen] = useState(false)
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false)
  const [notificationsError, setNotificationsError] = useState<string | null>(null)
  const navigate = useNavigate()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const notificationServiceRef = useRef<NotificationService | null>(null)

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Initialize NotificationService and fetch notifications
  useEffect(() => {
    const initializeNotificationService = async () => {
      try {
        setIsNotificationsLoading(true)
        setNotificationsError(null)

        // Create API client and service
        const apiClient = new NotificationApiClient({
          baseUrl: '/api',
          timeout: 10000,
          retryAttempts: 3,
          retryDelay: 1000
        })
        const service = new NotificationService({
          pollingInterval: 30000, // 30 seconds
          maxNotifications: 50,
          enableRealTimeUpdates: true,
          apiBaseUrl: '/api'
        }, apiClient)

        notificationServiceRef.current = service

        // Subscribe to notifications updates
        const unsubscribe = service.subscribe((updatedNotifications) => {
          setNotifications(updatedNotifications)
        })

        // Fetch initial notifications
        await service.fetchNotifications()

        // Start polling for new notifications
        service.startPolling()

        // Cleanup function
        return () => {
          unsubscribe()
          service.dispose()
        }
      } catch (error) {
        console.error('Error initializing notification service:', error)
        setNotificationsError('Erreur lors du chargement des notifications')
      } finally {
        setIsNotificationsLoading(false)
      }
    }

    const cleanup = initializeNotificationService()

    return () => {
      cleanup.then(cleanupFn => cleanupFn?.())
    }
  }, [])

  const logout = async () => {
    try {
      await fetch(API_ENDPOINTS.auth.logout, { credentials: "include", method: "POST" })
      setUserInfo(null)
      navigate("/")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }



  const markAllNotificationsAsRead = async () => {
    if (!notificationServiceRef.current) return
    
    try {
      await notificationServiceRef.current.markAllAsRead()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      setNotificationsError('Erreur lors du marquage des notifications')
    }
  }

  const markNotificationAsRead = async (id: string) => {
    if (!notificationServiceRef.current) return
    
    try {
      await notificationServiceRef.current.markAsRead(id)
    } catch (error) {
      console.error('Error marking notification as read:', error)
      setNotificationsError('Erreur lors du marquage de la notification')
    }
  }

  const handleNotificationClick = (notification: AdminNotification) => {
    // This will be handled by the NotificationPanel component
    // The panel will automatically mark as read and handle navigation
    console.log('Notification clicked:', notification)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close menus
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setUserMenuOpen(false)
        setNotificationsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50 shadow-sm backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 lg:px-6">
        <div className="flex h-12 items-center justify-between gap-2">
          {/* Logo and title - optimized layout */}
          <div className="flex items-center min-w-0">
            <Link to="/" className="flex items-center mr-6 flex-shrink-0">
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-lime-600 dark:text-lime-500"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                <path d="M2 2l7.586 7.586"></path>
                <circle cx="11" cy="11" r="2"></circle>
              </motion.svg>
              <motion.span 
                className="ml-3 text-xl font-bold text-gray-900 dark:text-white hidden sm:block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Admin
              </motion.span>
            </Link>

            {/* Main navigation - optimized layout without search */}
            <nav className="hidden md:flex space-x-2 ml-8">
              <motion.button
                onClick={() => onTabChange("users")}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center transition-all duration-200 ${
                  activeTab === "users"
                    ? "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 hover:shadow-sm"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Users className="w-4 h-4 mr-2" />
                Utilisateurs
              </motion.button>
              <motion.button
                onClick={() => onTabChange("statistics")}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center transition-all duration-200 ${
                  activeTab === "statistics"
                    ? "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 hover:shadow-sm"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <BarChart2 className="w-4 h-4 mr-2" />
                Statistiques
              </motion.button>
            </nav>
          </div>

          {/* Actions and profile - balanced spacing for notification panel */}
          <div className="flex items-center space-x-5">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <motion.button
                onClick={() => setNotificationsOpen(!isNotificationsOpen)}
                className="p-3 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 relative transition-colors duration-200 shadow-sm hover:shadow-md"
                aria-label="Notifications"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <motion.span 
                    className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full shadow-lg border-2 border-white dark:border-gray-800"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </motion.button>

              {/* New NotificationPanel */}
              <NotificationPanel
                notifications={notifications}
                isOpen={isNotificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                onMarkAsRead={markNotificationAsRead}
                onMarkAllAsRead={markAllNotificationsAsRead}
                onNotificationClick={handleNotificationClick}
                isLoading={isNotificationsLoading}
                error={notificationsError || undefined}
              />
            </div>

            {/* Theme */}
            <ThemeToggle />

            {/* User profile - improved spacing */}
            <div className="relative" ref={userMenuRef}>
              <motion.button
                onClick={() => setUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-3 rounded-full bg-gray-100 dark:bg-gray-700 p-1.5 pr-4 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="w-8 h-8 rounded-full bg-lime-600 dark:bg-lime-700 text-white flex items-center justify-center font-semibold">
                  {userInfo?.username?.substring(0, 1).toUpperCase() || "U"}
                </span>
                <span className="hidden sm:block font-medium">{userInfo?.username || "Utilisateur"}</span>
                <motion.div
                  animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </motion.button>

              {/* User menu */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div 
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700 origin-top-right"
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1 }}
                  >
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{userInfo?.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Administrateur</p>
                    </div>
                    <Link
                      to="/"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors duration-200"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Retour au site
                    </Link>
                    <Link
                      to="/edit_profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors duration-200"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profil
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Déconnexion
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu button */}
            <motion.button
              onClick={() => setMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>


      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="md:hidden border-t border-gray-200 dark:border-gray-700"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pt-4 pb-4 space-y-2">
              <motion.button
                onClick={() => {
                  onTabChange("users")
                  setMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center transition-all duration-200 ${
                  activeTab === "users"
                    ? "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                whileHover={{ backgroundColor: "rgba(236, 253, 245, 0.5)" }}
                whileTap={{ scale: 0.98 }}
              >
                <Users className="w-5 h-5 mr-3" />
                Utilisateurs
              </motion.button>
              <motion.button
                onClick={() => {
                  onTabChange("statistics")
                  setMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center transition-all duration-200 ${
                  activeTab === "statistics"
                    ? "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                whileHover={{ backgroundColor: "rgba(236, 253, 245, 0.5)" }}
                whileTap={{ scale: 0.98 }}
              >
                <BarChart2 className="w-5 h-5 mr-3" />
                Statistiques
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default AdminHeader