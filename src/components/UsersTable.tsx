import { User as UserType } from "../types/User"
import React, { useState } from "react"
import { getRoleColor, formatDate } from "../lib/utils"

export const UsersTable = ({
  users,
  onRoleChange,
  onDeleteUser,
  onResetPassword,
}: {
  users: UserType[]
  onRoleChange: (userId: string, newRole: "user" | "author" | "editor" | "admin") => void
  onDeleteUser: (userId: string, username: string) => void
  onResetPassword: (email: string, username: string) => void
}) => {
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const confirmRoleChange = (userId: string, newRole: "user" | "author" | "editor" | "admin", currentRole: string) => {
    if (newRole === currentRole) return

    if (window.confirm(`Êtes-vous sûr de vouloir changer le rôle de cet utilisateur en "${newRole}" ?`)) {
      onRoleChange(userId, newRole)
    }
  }

  const toggleUserDetails = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId)
  }

  return (
    <div className="bg-card shadow overflow-hidden sm:rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {users.map((user: UserType) => (
              <React.Fragment key={user._id}>
                <tr
                  className={`hover:bg-accent transition-colors cursor-pointer ${
                    expandedUser === user._id ? 'bg-accent' : ''
                  }`}
                  onClick={() => toggleUserDetails(user._id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium text-sm">
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
                    <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.isVerified
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}>
                      {user.isVerified ? 'Vérifié' : 'Non vérifié'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <select
                        value={user.role}
                        onChange={(e) => {
                          e.stopPropagation();
                          confirmRoleChange(user._id, e.target.value as "user" | "author" | "editor" | "admin", user.role);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                        aria-label={`Changer le rôle de ${user.username}`}
                      >
                        <option value="user">Utilisateur</option>
                        <option value="author">Auteur</option>
                        <option value="editor">Éditeur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleUserDetails(user._id);
                        }}
                        className="text-lime-600 hover:text-lime-900 dark:text-lime-400 dark:hover:text-lime-300"
                      >
                        {expandedUser === user._id ? 'Masquer' : 'Détails'}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedUser === user._id && (
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Informations utilisateur</h4>
                          <div className="mt-2 space-y-2">
                            <p className="text-sm text-gray-900 dark:text-white">
                              <span className="font-medium">ID:</span> {user._id}
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              <span className="font-medium">Nom complet:</span> {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              <span className="font-medium">Email:</span> {user.email}
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              <span className="font-medium">Rôle:</span> {user.role}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Dates</h4>
                          <div className="mt-2 space-y-2">
                            <p className="text-sm text-gray-900 dark:text-white">
                              <span className="font-medium">Créé le:</span> {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              <span className="font-medium">Dernière mise à jour:</span> {user.updatedAt ? formatDate(user.updatedAt) : 'N/A'}
                            </p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              <span className="font-medium">Dernière connexion:</span> {user.lastLogin ? formatDate(user.lastLogin) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <button
                          className="px-3 py-1 bg-lime-600 text-white rounded-md text-sm hover:bg-lime-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onResetPassword(user.email, user.username);
                          }}
                        >
                          Réinitialiser mot de passe
                        </button>
                        <button
                          className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteUser(user._id, user.username);
                          }}
                        >
                          Supprimer l'utilisateur
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}