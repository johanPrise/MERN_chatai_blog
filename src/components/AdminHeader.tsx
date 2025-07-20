import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { UserContext } from "../UserContext"
import { ThemeToggle } from "./ui/theme-toggle"
import { API_ENDPOINTS } from "../config/api.config"
import {
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  Home,
  Users,
  BarChart2,
  Menu,
  X,
  ChevronDown,
} from "lucide-react"

interface AdminHeaderProps {
  activeTab: "users" | "statistics" | "settings"
  onTabChange: (tab: "users" | "statistics" | "settings") => void
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, onTabChange }) => {
  const { userInfo, setUserInfo } = UserContext()
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isUserMenuOpen, setUserMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<{ id: string; message: string; read: boolean }[]>([])
  const [isNotificationsOpen, setNotificationsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()

  // Simuler des notifications pour la démonstration
  useEffect(() => {
    setNotifications([
      { id: "1", message: "Nouvel utilisateur inscrit", read: false },
      { id: "2", message: "Mise à jour système disponible", read: false },
      { id: "3", message: "5 nouveaux commentaires à modérer", read: true },
    ])
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implémentation de la recherche globale
    console.log("Recherche:", searchQuery)
    // Réinitialiser le champ de recherche
    setSearchQuery("")
    setSearchOpen(false)
  }

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-lime-600 dark:text-lime-500"
              >
                <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                <path d="M2 2l7.586 7.586"></path>
                <circle cx="11" cy="11" r="2"></circle>
              </svg>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white hidden sm:block">Admin</span>
            </Link>

            {/* Navigation principale - visible sur desktop */}
            <nav className="hidden md:flex space-x-1">
              <button
                onClick={() => onTabChange("users")}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  activeTab === "users"
                    ? "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <Users className="w-4 h-4 mr-1.5" />
                Utilisateurs
              </button>
              <button
                onClick={() => onTabChange("statistics")}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  activeTab === "statistics"
                    ? "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <BarChart2 className="w-4 h-4 mr-1.5" />
                Statistiques
              </button>
              <button
                onClick={() => onTabChange("settings")}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                  activeTab === "settings"
                    ? "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <Settings className="w-4 h-4 mr-1.5" />
                Paramètres
              </button>
            </nav>
          </div>

          {/* Actions et profil */}
          <div className="flex items-center space-x-3">
            {/* Bouton de recherche */}
            <button
              onClick={() => setSearchOpen(!isSearchOpen)}
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Recherche"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown des notifications */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-xs text-lime-600 hover:text-lime-700 dark:text-lime-400 dark:hover:text-lime-300"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Aucune notification</p>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            !notification.read ? "bg-lime-50 dark:bg-lime-900/20" : ""
                          }`}
                        >
                          <p className="text-sm text-gray-700 dark:text-gray-300">{notification.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Thème */}
            <ThemeToggle />

            {/* Profil utilisateur */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 rounded-full bg-gray-100 dark:bg-gray-700 p-1 pr-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <span className="w-8 h-8 rounded-full bg-lime-600 dark:bg-lime-700 text-white flex items-center justify-center">
                  {userInfo?.username?.substring(0, 1).toUpperCase() || "U"}
                </span>
                <span className="hidden sm:block">{userInfo?.username || "Utilisateur"}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Menu utilisateur */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{userInfo?.username}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Administrateur</p>
                  </div>
                  <Link
                    to="/"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Retour au site
                  </Link>
                  <Link
                    to="/edit_profile"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profil
                  </Link>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>

            {/* Bouton menu mobile */}
            <button
              onClick={() => setMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        {isSearchOpen && (
          <div className="py-3 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un utilisateur, un paramètre..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-lime-600 text-white rounded-r-md hover:bg-lime-700 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Menu mobile */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <button
              onClick={() => {
                onTabChange("users")
                setMenuOpen(false)
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                activeTab === "users"
                  ? "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Utilisateurs
            </button>
            <button
              onClick={() => {
                onTabChange("statistics")
                setMenuOpen(false)
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                activeTab === "statistics"
                  ? "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              Statistiques
            </button>
            <button
              onClick={() => {
                onTabChange("settings")
                setMenuOpen(false)
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                activeTab === "settings"
                  ? "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Paramètres
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default AdminHeader
