import React from "react"

export const Pagination = ({
  page,
  totalPages,
  setPage,
}: {
  page: number
  totalPages: number
  setPage: (value: React.SetStateAction<number>) => void
}) => {
  return (
    <div className="mt-6 flex justify-center items-center">
      <button
        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        disabled={page === 1}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md mr-2 disabled:bg-gray-400"
        aria-label="Page précédente"
      >
        Précédent
      </button>
      <span className="mx-4">
        Page {page} sur {totalPages}
      </span>
      <button
        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        disabled={page === totalPages}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md ml-2 disabled:bg-gray-400"
        aria-label="Page suivante"
      >
        Suivant
      </button>
    </div>
  )
}