"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { UserContext } from "../UserContext"
import React from "react"
import { User as UserType } from "../types/User"
import { SearchAndSortControls } from "../components/SearchAndSortControls"
import {UsersTable} from "../components/UsersTable";
import {Pagination} from "../components/AdminPagination";
import { AddUserModal } from "../components/AddUserModal";
import { AdminStatistics } from "../components/AdminStatistics";
import { AdminSettings } from "../components/AdminSettings";
import AdminHeader from "../components/AdminHeader";
import { API_ENDPOINTS } from "../config/api.config"

// Composant principal
function AdminDashboard() {
  const [users, setUsers] = useState<UserType[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("username")
  const [order, setOrder] = useState("asc")
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"users" | "statistics" | "settings">("users")

  // Utiliser le hook UserContext pour accéder au contexte utilisateur
  const { userInfo } = UserContext()

  // Vérifier le statut d'administrateur en utilisant la route dédiée
  const checkAdminStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log("Vérification du statut d'administrateur...")

      // Vérifier si userInfo contient déjà le rôle
      if (userInfo && userInfo.role === 'admin') {
        console.log("Utilisateur déjà identifié comme admin via userInfo")
        setIsAdmin(true)
        return
      }

      const response = await fetch(API_ENDPOINTS.auth.checkAdmin, {
        credentials: "include",
      })

      console.log("Réponse de vérification admin:", response.status)

      if (!response.ok) {
        // Essayer de récupérer les détails de l'erreur depuis la réponse
        let errorMessage = "Échec de la vérification du statut d'administrateur";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Détails de l'erreur:", errorData);
        } catch (e) {
          console.error("Impossible de parser la réponse d'erreur:", e);
        }
        throw new Error(`${errorMessage} (${response.status})`);
      }

      const data = await response.json()
      console.log("Données de vérification admin:", data)

      // La route /auth/check-admin renvoie { isAdmin: boolean }
      setIsAdmin(data.isAdmin)
    } catch (error) {
      console.error("Error checking admin status:", error)
      setIsAdmin(false)
      setError(`Impossible de vérifier les privilèges d'administrateur: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
    } finally {
      setIsLoading(false)
    }
  }, [userInfo])

  // Récupérer la liste des utilisateurs
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Construire l'URL avec les paramètres de requête
      const baseUrl = API_ENDPOINTS.users.list

      // Vérifier si baseUrl est une URL complète ou un chemin relatif
      let url;
      try {
        // Essayer de créer une URL complète
        url = new URL(baseUrl);
      } catch (e) {
        // Si baseUrl est un chemin relatif, créer une URL avec l'origine actuelle
        url = new URL(baseUrl, window.location.origin);
      }

      // Ajouter les paramètres de requête
      url.searchParams.append("page", page.toString())
      url.searchParams.append("search", search)
      url.searchParams.append("sort", sort)
      url.searchParams.append("order", order)

      console.log("Fetching users from URL:", url.toString())

      const response = await fetch(url.toString(), {
        credentials: "include",
      })

      if (!response.ok) {
        // Essayer de récupérer les détails de l'erreur depuis la réponse
        let errorMessage = "Échec de la récupération des utilisateurs";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Détails de l'erreur:", errorData);
        } catch (e) {
          console.error("Impossible de parser la réponse d'erreur:", e);
        }
        throw new Error(`${errorMessage} (${response.status})`);
      }

      const data = await response.json();
      console.log("Données des utilisateurs reçues:", data);

      // Vérifier si data contient un tableau users
      if (data && Array.isArray(data.users)) {
        setUsers(data.users);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        // Si data est directement un tableau d'utilisateurs
        setUsers(data);
        setTotalPages(1);
      } else {
        console.error("Format de données inattendu:", data);
        throw new Error("Format de données inattendu");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(`Impossible de récupérer la liste des utilisateurs: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, sort, order])

  // Changer le rôle d'un utilisateur
  const handleRoleChange = useCallback(async (userId: string, newRole: "user" | "author" | "admin" | "editor") => {
    setIsLoading(true)
    setError(null)

    try {
      console.log(`Changement de rôle pour l'utilisateur ${userId} vers ${newRole}`)

      const response = await fetch(API_ENDPOINTS.users.changeRole(userId), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
        credentials: "include",
      })

      console.log("Réponse de changement de rôle:", response.status)

      if (!response.ok) {
        // Essayer de récupérer les détails de l'erreur depuis la réponse
        let errorMessage = "Une erreur est survenue lors du changement de rôle";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Détails de l'erreur:", errorData);
        } catch (e) {
          console.error("Impossible de parser la réponse d'erreur:", e);
        }
        throw new Error(`${errorMessage} (${response.status})`);
      }

      const data = await response.json()
      console.log("Données de changement de rôle:", data)

      // Mise à jour de l'interface utilisateur avec les données du serveur
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      )

      console.log(data.message || "Rôle modifié avec succès")
    } catch (error) {
      console.error("Erreur lors du changement de rôle:", error)
      setError(error instanceof Error ? error.message : "Une erreur inconnue est survenue")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Supprimer un utilisateur
  const handleDeleteUser = useCallback(async (userId: string, username: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${username} ?`)) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log(`Suppression de l'utilisateur ${userId}`)

      const response = await fetch(API_ENDPOINTS.users.detail(userId), {
        method: "DELETE",
        credentials: "include",
      })

      console.log("Réponse de suppression d'utilisateur:", response.status)

      if (!response.ok) {
        // Essayer de récupérer les détails de l'erreur depuis la réponse
        let errorMessage = "Une erreur est survenue lors de la suppression de l'utilisateur";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Détails de l'erreur:", errorData);
        } catch (e) {
          console.error("Impossible de parser la réponse d'erreur:", e);
        }
        throw new Error(`${errorMessage} (${response.status})`);
      }

      const data = await response.json()
      console.log("Données de suppression d'utilisateur:", data)

      // Mise à jour de l'interface utilisateur en retirant l'utilisateur supprimé
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId))

      // Afficher un message de succès
      alert(data.message || "Utilisateur supprimé avec succès")
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error)
      setError(error instanceof Error ? error.message : "Une erreur inconnue est survenue")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Envoyer un email de réinitialisation de mot de passe
  const handleResetPassword = useCallback(async (email: string, username: string) => {
    if (!window.confirm(`Envoyer un email de réinitialisation de mot de passe à ${username} (${email}) ?`)) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log(`Envoi d'un email de réinitialisation à ${email}`)

      const response = await fetch(API_ENDPOINTS.auth.forgotPassword, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include",
      })

      console.log("Réponse de réinitialisation de mot de passe:", response.status)

      if (!response.ok) {
        // Essayer de récupérer les détails de l'erreur depuis la réponse
        let errorMessage = "Une erreur est survenue lors de l'envoi de l'email de réinitialisation";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Détails de l'erreur:", errorData);
        } catch (e) {
          console.error("Impossible de parser la réponse d'erreur:", e);
        }
        throw new Error(`${errorMessage} (${response.status})`);
      }

      const data = await response.json()
      console.log("Données de réinitialisation de mot de passe:", data)

      // Afficher un message de succès
      alert(data.message || "Email de réinitialisation envoyé avec succès")
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'email de réinitialisation:", error)
      setError(error instanceof Error ? error.message : "Une erreur inconnue est survenue")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Vérifier le statut d'administrateur au chargement
  useEffect(() => {
    checkAdminStatus()
  }, [checkAdminStatus])

  // Récupérer les utilisateurs lorsque les filtres changent
  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin, fetchUsers])

  // Afficher un message si l'utilisateur n'est pas administrateur
  if (!userInfo || !isAdmin) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-center text-2xl font-bold text-indigo-600 sm:text-3xl">Accès Non Autorisé</h1>
          <p className="mx-auto mt-4 max-w-md text-center text-gray-500">
            Cette page est réservée aux administrateurs. Veuillez vous connecter avec un compte administrateur.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header amélioré */}
      <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-grow py-6">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          {/* Titre de la page en fonction de l'onglet actif */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {activeTab === "users" && "Gestion des Utilisateurs"}
              {activeTab === "statistics" && "Statistiques du Site"}
              {activeTab === "settings" && "Paramètres du Système"}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {activeTab === "users" && "Gérez les utilisateurs, leurs rôles et leurs permissions."}
              {activeTab === "statistics" && "Consultez les statistiques et l'activité de votre site."}
              {activeTab === "settings" && "Configurez les paramètres de votre application."}
            </p>
          </div>

          {/* Cartes de statistiques rapides - uniquement sur l'onglet utilisateurs */}
          {activeTab === "users" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-lime-100 dark:bg-lime-900 text-lime-600 dark:text-lime-400 mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Utilisateurs</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{users.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Auteurs</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {users.filter(user => user.role === 'author').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Éditeurs</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {users.filter(user => user.role === 'editor').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administrateurs</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {users.filter(user => user.role === 'admin').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Contenu principal en fonction de l'onglet actif */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-500"></div>
            <span className="ml-3 text-gray-700 dark:text-gray-300">Chargement des données...</span>
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg shadow" role="alert">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <p className="font-bold">Erreur</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => fetchUsers()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Onglet Utilisateurs */}
            {activeTab === "users" && (
              <>
                {/* Contrôles de recherche et de tri */}
                <SearchAndSortControls
                  search={search}
                  setSearch={setSearch}
                  sort={sort}
                  setSort={setSort}
                  order={order}
                  setOrder={setOrder}
                />

                {users.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Aucun utilisateur trouvé</h3>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">Essayez de modifier vos critères de recherche ou de filtrage.</p>
                  </div>
                ) : (
                  <>
                    <UsersTable
                      users={users}
                      onRoleChange={handleRoleChange}
                      onDeleteUser={handleDeleteUser}
                      onResetPassword={handleResetPassword}
                    />

                    {/* Pagination */}
                    <div className="mt-6">
                      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Onglet Statistiques */}
            {activeTab === "statistics" && (
              <AdminStatistics users={users} />
            )}

            {/* Onglet Paramètres */}
            {activeTab === "settings" && (
              <AdminSettings />
            )}
          </>
        )}

          {/* Actions rapides - visible uniquement dans l'onglet Utilisateurs */}
          {activeTab === "users" && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="px-4 py-2 bg-lime-600 text-white rounded-md hover:bg-lime-700 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Ajouter un utilisateur
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Blog AI - Tableau de bord administrateur
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-lime-600 dark:hover:text-lime-500">
                Aide
              </a>
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-lime-600 dark:hover:text-lime-500">
                Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal d'ajout d'utilisateur */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserAdded={() => {
          fetchUsers();
          setIsAddUserModalOpen(false);
        }}
      />
    </div>
  )
}

export default AdminDashboard

