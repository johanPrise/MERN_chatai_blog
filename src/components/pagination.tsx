"use client"

import React from "react"
import { useState } from "react"
import { Button } from "./ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  pageSize?: number
  totalItems?: number
  showFirstLast?: boolean
  showPageSize?: boolean
  pageSizeOptions?: number[]
  onPageSizeChange?: (pageSize: number) => void
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  totalItems,
  showFirstLast = false,
  showPageSize = false,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
}) => {
  const [inputPage, setInputPage] = useState(currentPage.toString())

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value)
  }

  const handlePageInputBlur = () => {
    const page = Math.max(1, Math.min(Number.parseInt(inputPage) || 1, totalPages))
    setInputPage(page.toString())
    onPageChange(page)
  }

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handlePageInputBlur()
    }
  }

  const renderPageNumbers = () => {
    const pageNumbers: React.ReactElement[] = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button
          key={i}
          onClick={() => onPageChange(i)}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
          className="w-9 h-9 p-0"
        >
          {i}
        </Button>,
      )
    }
    return pageNumbers
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-2">
        {showFirstLast && (
          <Button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            variant="outline"
            size="icon"
            className="h-9 w-9"
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size="icon"
          className="h-9 w-9"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-2">{renderPageNumbers()}</div>

        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="icon"
          className="h-9 w-9"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {showFirstLast && (
          <Button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="icon"
            className="h-9 w-9"
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>Page</span>
        <div className="flex items-center">
          <input
            type="number"
            value={inputPage}
            onChange={handlePageInputChange}
            onBlur={handlePageInputBlur}
            onKeyDown={handlePageInputKeyDown}
            className="w-12 h-8 rounded-md border border-input bg-transparent px-3 py-1 text-sm text-center"
            min={1}
            max={totalPages}
          />
          <span className="ml-1">of {totalPages}</span>
        </div>
        {totalItems && <span className="ml-2">({totalItems} items)</span>}
      </div>

      {showPageSize && onPageSizeChange && (
        <div className="flex items-center space-x-2 text-sm">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>per page</span>
        </div>
      )}
    </div>
  )
}

export default Pagination

