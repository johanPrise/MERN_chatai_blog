import { SortOption } from "../types/SortOption"
import { useMemo, useState } from "react"
import React from "react"

export const SearchAndSortControls = ({
  search,
  setSearch,
  sort,
  setSort,
  order,
  setOrder,
}: {
  search: string
  setSearch: (value: string) => void
  sort: string
  setSort: (value: string) => void
  order: string
  setOrder: (value: string) => void
}) => {
  const [filterRole, setFilterRole] = useState<string>("")
  const [filterVerified, setFilterVerified] = useState<string>("")
  const [showFilters, setShowFilters] = useState<boolean>(false)

  const sortOptions: SortOption[] = useMemo(
    () => [
      { label: "Nom d'utilisateur", value: "username" },
      { label: "Email", value: "email" },
      { label: "Rôle", value: "role" },
      { label: "Date de création", value: "createdAt" },
      { label: "Dernière connexion", value: "lastLogin" },
    ],
    []
  )

  const roleOptions: SortOption[] = useMemo(
    () => [
      { label: "Tous les rôles", value: "" },
      { label: "Utilisateur", value: "user" },
      { label: "Auteur", value: "author" },
      { label: "Éditeur", value: "editor" },
      { label: "Administrateur", value: "admin" },
    ],
    []
  )

  const verifiedOptions: SortOption[] = useMemo(
    () => [
      { label: "Tous les statuts", value: "" },
      { label: "Vérifié", value: "verified" },
      { label: "Non vérifié", value: "unverified" },
    ],
    []
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const handleClearSearch = () => {
    setSearch("")
  }

  const handleFilterRole = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterRole(e.target.value)
    // Ici, vous pourriez ajouter une logique pour filtrer les utilisateurs par rôle
    // Cette fonctionnalité nécessiterait des modifications dans le composant parent
  }

  const handleFilterVerified = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterVerified(e.target.value)
    // Ici, vous pourriez ajouter une logique pour filtrer les utilisateurs par statut de vérification
    // Cette fonctionnalité nécessiterait des modifications dans le composant parent
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={handleSearch}
            className="pl-10 pr-10 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-lime-500 focus:border-lime-500"
            aria-label="Rechercher un utilisateur"
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Effacer la recherche"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center"
            aria-label="Afficher/masquer les filtres"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
            Filtres {showFilters ? '▲' : '▼'}
          </button>

          <div className="flex items-center space-x-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              aria-label="Trier par"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
              className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              aria-label={`Trier par ordre ${order === "asc" ? "croissant" : "décroissant"}`}
            >
              {order === "asc" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 animate-fadeIn">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filtres avancés</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="filter-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filtrer par rôle
              </label>
              <select
                id="filter-role"
                value={filterRole}
                onChange={handleFilterRole}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-verified" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filtrer par statut
              </label>
              <select
                id="filter-verified"
                value={filterVerified}
                onChange={handleFilterVerified}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              >
                {verifiedOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setFilterRole("");
                setFilterVerified("");
                // Réinitialiser d'autres filtres si nécessaire
              }}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}
    </div>
  )
}