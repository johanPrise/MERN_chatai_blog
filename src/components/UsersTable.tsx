import { User as UserType } from "../types/User"
import React, { useState } from "react"
import { getRoleColor, formatDate } from "../lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  UserCheck, 
  UserX, 
  Mail, 
  Trash2,
  CheckSquare,
  Square,
  MoreHorizontal,
  Eye,
  Edit3
} from "lucide-react"

interface UsersTableProps {
  users: UserType[]
  onRoleChange: (userId: string, newRole: "user" | "author" | "editor" | "admin") => void
  onDeleteUser: (userId: string, username: string) => void
  onResetPassword: (email: string, username: string) => void
}

export const UsersTable = ({
  users,
  onRoleChange,
  onDeleteUser,
  onResetPassword,
}: UsersTableProps) => {
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
    search: ""
  })
  const [sortBy, setSortBy] = useState<"username" | "email" | "role" | "createdAt">("username")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)

  // Filter and sort users
  const filteredAndSortedUsers = React.useMemo(() => {
    let result = [...users]
    
    // Apply filters
    if (filters.role !== "all") {
      result = result.filter(user => user.role === filters.role)
    }
    
    if (filters.status !== "all") {
      result = result.filter(user => 
        filters.status === "verified" ? user.isVerified : !user.isVerified
      )
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(user => 
        user.username.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue: string | number = a[sortBy]
      let bValue: string | number = b[sortBy]
      
      // Special handling for dates
      if (sortBy === "createdAt") {
        aValue = new Date(a[sortBy]).getTime()
        bValue = new Date(b[sortBy]).getTime()
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    return result
  }, [users, filters, sortBy, sortOrder])

  const confirmRoleChange = (userId: string, newRole: "user" | "author" | "editor" | "admin", currentRole: string) => {
    if (newRole === currentRole) return

    if (window.confirm(`Êtes-vous sûr de vouloir changer le rôle de cet utilisateur en "${newRole}" ?`)) {
      onRoleChange(userId, newRole)
    }
  }

  const toggleUserDetails = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId)
    // Close action menu when expanding/collapsing
    if (actionMenuOpen === userId) {
      setActionMenuOpen(null)
    }
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredAndSortedUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredAndSortedUsers.map(user => user._id))
    }
  }

  const handleBulkRoleChange = (newRole: "user" | "author" | "editor" | "admin") => {
    if (selectedUsers.length === 0) return
    
    if (window.confirm(`Êtes-vous sûr de vouloir changer le rôle de ${selectedUsers.length} utilisateurs en "${newRole}" ?`)) {
      selectedUsers.forEach(userId => {
        const user = users.find(u => u._id === userId)
        if (user && user.role !== newRole) {
          onRoleChange(userId, newRole)
        }
      })
      setSelectedUsers([])
    }
  }

  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) return
    
    const userNames = selectedUsers
      .map(id => users.find(u => u._id === id)?.username)
      .filter(Boolean)
      .join(", ")
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedUsers.length} utilisateurs : ${userNames} ?`)) {
      selectedUsers.forEach(userId => {
        const user = users.find(u => u._id === userId)
        if (user) {
          onDeleteUser(userId, user.username)
        }
      })
      setSelectedUsers([])
    }
  }

  const handleBulkResetPassword = () => {
    if (selectedUsers.length === 0) return
    
    if (window.confirm(`Êtes-vous sûr de vouloir envoyer des emails de réinitialisation de mot de passe à ${selectedUsers.length} utilisateurs ?`)) {
      selectedUsers.forEach(userId => {
        const user = users.find(u => u._id === userId)
        if (user) {
          onResetPassword(user.email, user.username)
        }
      })
      setSelectedUsers([])
    }
  }

  const clearFilters = () => {
    setFilters({
      role: "all",
      status: "all",
      search: ""
    })
  }

  const toggleActionMenu = (userId: string) => {
    setActionMenuOpen(actionMenuOpen === userId ? null : userId)
  }

  return (
    <div className="bg-card shadow overflow-hidden sm:rounded-lg border border-border">
      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedUsers.length > 0 && (
          <motion.div 
            className="bg-gradient-to-r from-lime-50 to-green-50 dark:from-lime-900/30 dark:to-green-900/30 border-b border-lime-200 dark:border-lime-800 p-4 flex flex-wrap items-center justify-between gap-4"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center">
              <span className="text-lime-800 dark:text-lime-200 font-medium">
                {selectedUsers.length} utilisateur(s) sélectionné(s)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                onChange={(e) => handleBulkRoleChange(e.target.value as any)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-500"
              >
                <option value="">Changer le rôle</option>
                <option value="user">Utilisateur</option>
                <option value="author">Auteur</option>
                <option value="editor">Éditeur</option>
                <option value="admin">Administrateur</option>
              </select>
              <button
                onClick={handleBulkResetPassword}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Mail className="w-4 h-4 mr-1" />
                Réinitialiser mots de passe
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Supprimer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Filters and Search */}
      <div className="p-4 border-b border-border bg-muted/50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Rechercher des utilisateurs..."
              className="block w-full pl-10 pr-3 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 shadow-sm"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center px-3 py-2.5 border border-border rounded-lg bg-background text-foreground hover:bg-muted transition-colors shadow-sm"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtres
                <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isFilterOpen && (
                <motion.div 
                  className="absolute right-0 mt-1 w-64 bg-background border border-border rounded-lg shadow-lg z-10 p-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium">Filtres</h3>
                    <button 
                      onClick={clearFilters}
                      className="text-xs text-lime-600 hover:text-lime-800 dark:text-lime-400 dark:hover:text-lime-300"
                    >
                      Effacer
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Rôle</label>
                      <select
                        value={filters.role}
                        onChange={(e) => setFilters({...filters, role: e.target.value})}
                        className="w-full px-2.5 py-1.5 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-lime-500"
                      >
                        <option value="all">Tous les rôles</option>
                        <option value="user">Utilisateur</option>
                        <option value="author">Auteur</option>
                        <option value="editor">Éditeur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Statut</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        className="w-full px-2.5 py-1.5 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-lime-500"
                      >
                        <option value="all">Tous les statuts</option>
                        <option value="verified">Vérifié</option>
                        <option value="unverified">Non vérifié</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-')
                  setSortBy(newSortBy as any)
                  setSortOrder(newSortOrder as any)
                }}
                className="px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-lime-500 shadow-sm"
              >
                <option value="username-asc">Nom (A-Z)</option>
                <option value="username-desc">Nom (Z-A)</option>
                <option value="email-asc">Email (A-Z)</option>
                <option value="email-desc">Email (Z-A)</option>
                <option value="role-asc">Rôle (A-Z)</option>
                <option value="role-desc">Rôle (Z-A)</option>
                <option value="createdAt-desc">Inscription (Récent)</option>
                <option value="createdAt-asc">Inscription (Ancien)</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                <button 
                  onClick={handleSelectAll}
                  className="text-muted-foreground hover:text-foreground rounded focus:outline-none focus:ring-2 focus:ring-lime-500"
                  aria-label={selectedUsers.length === filteredAndSortedUsers.length ? "Désélectionner tous" : "Sélectionner tous"}
                >
                  {selectedUsers.length === filteredAndSortedUsers.length ? (
                    <CheckSquare className="h-4 w-4 text-lime-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Inscription
              </th>
              <th className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {filteredAndSortedUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <UserX className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-1">Aucun utilisateur trouvé</h3>
                    <p className="text-sm text-muted-foreground/80">Essayez d'ajuster vos filtres ou termes de recherche</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedUsers.map((user: UserType, index) => (
                <React.Fragment key={user._id}>
                  <motion.tr
                    className={`hover:bg-accent transition-all duration-150 ${
                      expandedUser === user._id ? 'bg-accent' : ''
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectUser(user._id)
                        }}
                        className="text-muted-foreground hover:text-foreground rounded focus:outline-none focus:ring-2 focus:ring-lime-500"
                        aria-label={selectedUsers.includes(user._id) ? "Désélectionner" : "Sélectionner"}
                      >
                        {selectedUsers.includes(user._id) ? (
                          <CheckSquare className="h-4 w-4 text-lime-600" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-lime-100 to-green-100 dark:from-lime-900/30 dark:to-green-900/30 flex items-center justify-center border border-lime-200 dark:border-lime-800/50">
                          <span className="text-lime-800 dark:text-lime-200 font-medium text-sm">
                            {user.username.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">
                            {user.username}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.firstName} {user.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isVerified
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {user.isVerified ? 'Vérifié' : 'Non vérifié'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <select
                          value={user.role}
                          onChange={(e) => {
                            e.stopPropagation();
                            confirmRoleChange(user._id, e.target.value as "user" | "author" | "editor" | "admin", user.role);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-lime-500"
                          aria-label={`Changer le rôle de ${user.username}`}
                        >
                          <option value="user">Utilisateur</option>
                          <option value="author">Auteur</option>
                          <option value="editor">Éditeur</option>
                          <option value="admin">Administrateur</option>
                        </select>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActionMenu(user._id);
                            }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-lime-500"
                            aria-label="Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          
                          {actionMenuOpen === user._id && (
                            <motion.div 
                              className="absolute right-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-10 py-1"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.1 }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleUserDetails(user._id);
                                  setActionMenuOpen(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir détails
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onResetPassword(user.email, user.username);
                                  setActionMenuOpen(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-muted"
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Réinitialiser mot de passe
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteUser(user._id, user.username);
                                  setActionMenuOpen(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-muted"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </button>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                  {expandedUser === user._id && (
                    <motion.tr 
                      className="bg-muted/50"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td colSpan={7} className="px-6 py-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2">
                            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                              <UserCheck className="h-4 w-4 mr-2 text-lime-600" />
                              Informations détaillées
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">ID</p>
                                <p className="text-sm font-mono text-foreground mt-1">{user._id}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Nom complet</p>
                                <p className="text-sm text-foreground mt-1">{user.firstName} {user.lastName}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                                <p className="text-sm text-foreground mt-1">{user.email}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Rôle</p>
                                <p className="text-sm text-foreground mt-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                    {user.role}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3">Dates importantes</h4>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Création</p>
                                <p className="text-sm text-foreground mt-1">
                                  {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Dernière mise à jour</p>
                                <p className="text-sm text-foreground mt-1">
                                  {user.updatedAt ? formatDate(user.updatedAt) : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Dernière connexion</p>
                                <p className="text-sm text-foreground mt-1">
                                  {user.lastLogin ? formatDate(user.lastLogin) : 'Jamais'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            className="inline-flex items-center px-3 py-1.5 bg-lime-600 text-white rounded-md text-sm hover:bg-lime-700 transition-colors shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onResetPassword(user.email, user.username);
                            }}
                          >
                            <Mail className="w-4 h-4 mr-1" />
                            Réinitialiser mot de passe
                          </button>
                          <button
                            className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteUser(user._id, user.username);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Supprimer l'utilisateur
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}