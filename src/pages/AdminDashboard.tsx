"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { UserContext } from "../UserContext"
import React from "react"
import { User as UserType } from "../types/User"
import { SearchAndSortControls } from "../components/SearchAndSortControls"
import {UsersTable} from "../components/UsersTable";
import {Pagination} from "../components/AdminPagination";

// Constantes pour les URL d'API
const API_BASE_URL = "https://mern-backend-neon.vercel.app"
const API_ENDPOINTS = {
  // Utiliser les routes existantes
  checkAdmin: `${API_BASE_URL}/check-admin`, // Route spécifique pour vérifier le statut admin
  users: `${API_BASE_URL}/users`,
  changeRole: `${API_BASE_URL}/change-user-role` // Route pour changer le rôle d'un utilisateur
}

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

  // Utiliser le hook UserContext pour accéder au contexte utilisateur
  const { userInfo } = UserContext()

  // Vérifier le statut d'administrateur en utilisant la route dédiée
  const checkAdminStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(API_ENDPOINTS.checkAdmin, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Échec de la vérification du statut d'administrateur")
      }

      const data = await response.json()

      // La route /check-admin renvoie { isAdmin: boolean }
      setIsAdmin(data.isAdmin)
    } catch (error) {
      console.error("Error checking admin status:", error)
      setIsAdmin(false)
      setError("Impossible de vérifier les privilèges d'administrateur")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Récupérer la liste des utilisateurs
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const url = new URL(API_ENDPOINTS.users)
      url.searchParams.append("page", page.toString())
      url.searchParams.append("search", search)
      url.searchParams.append("sort", sort)
      url.searchParams.append("order", order)

      const response = await fetch(url.toString(), {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Échec de la récupération des utilisateurs")
      }

      const data = await response.json()
      setUsers(data.users)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Impossible de récupérer la liste des utilisateurs. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }, [page, search, sort, order])

  // Changer le rôle d'un utilisateur
  const handleRoleChange = useCallback(async (userId: string, newRole: "user" | "author" | "admin") => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(API_ENDPOINTS.changeRole, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, newRole }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue lors du changement de rôle")
      }

      // Mise à jour de l'interface utilisateur avec les données du serveur
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      )

      console.log(data.message)
    } catch (error) {
      console.error("Erreur lors du changement de rôle:", error)
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
    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-center text-3xl font-bold text-indigo-600 mb-8">Tableau de Bord Administrateur</h1>

        <SearchAndSortControls
          search={search}
          setSearch={setSearch}
          sort={sort}
          setSort={setSort}
          order={order}
          setOrder={setOrder}
        />

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Erreur: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun utilisateur trouvé.
          </div>
        ) : (
          <UsersTable users={users} onRoleChange={handleRoleChange} />
        )}

        {!isLoading && !error && users.length > 0 && (
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        )}
      </div>
    </div>
  )
}

export default AdminDashboard

