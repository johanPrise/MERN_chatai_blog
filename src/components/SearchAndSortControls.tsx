import { SortOption } from "../types/SortOption"
import { useMemo } from "react"
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
  const sortOptions: SortOption[] = useMemo(
    () => [
      { label: "Nom d'utilisateur", value: "username" },
      { label: "Email", value: "email" },
      { label: "Rôle", value: "role" },
    ],
    []
  )

  return (
    <div className="mb-6 flex justify-between items-center">
      <input
        type="text"
        placeholder="Rechercher un utilisateur..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-4 py-2 border rounded-md w-64"
        aria-label="Rechercher un utilisateur"
      />
      <div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2 border rounded-md mr-2"
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
          className="px-4 py-2 bg-gray-200 rounded-md"
          aria-label={`Trier par ordre ${order === "asc" ? "croissant" : "décroissant"}`}
        >
          {order === "asc" ? "↑" : "↓"}
        </button>
      </div>
    </div>
  )
}