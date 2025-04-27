export type PaginationProps = {
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