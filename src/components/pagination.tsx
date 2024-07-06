import React, { useState } from 'react';
import { FaAngleLeft, FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
  showFirstLast?: boolean;
  showPageSize?: boolean;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  totalItems,
  showFirstLast = true,
  showPageSize = true,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
}) => {
  const [inputPage, setInputPage] = useState(currentPage.toString());

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value);
  };

  const handlePageInputBlur = () => {
    const page = Math.max(1, Math.min(parseInt(inputPage) || 1, totalPages));
    setInputPage(page.toString());
    onPageChange(page);
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-1 rounded ${
            i === currentPage ? 'bg-green-500 text-white' : 'bg-stone-200 text-gray-700 hover:bg-stone-300'
          }`}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };

  return (
    <div className="flex flex-col items-center space-y-2 mt-4">
      <div className="flex items-center space-x-2">
        {showFirstLast && (
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-1 rounded bg-stone-200 text-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaAngleDoubleLeft className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 rounded bg-stone-200 text-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaAngleLeft className="h-4 w-4" />
        </button>
        {renderPageNumbers()}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1 rounded bg-stone-200 text-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaAngleRight className="h-4 w-4" />
        </button>
        {showFirstLast && (
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1 rounded bg-stone-200 text-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaAngleDoubleRight className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex items-center space-x-2 text-sm">
        <span>Page</span>
        <input
          type="number"
          value={inputPage}
          onChange={handlePageInputChange}
          onBlur={handlePageInputBlur}
          className="w-12 p-1 rounded border border-gray-300 text-center"
          min={1}
          max={totalPages}
        />
        <span>sur {totalPages}</span>
        {totalItems && <span>| Total: {totalItems} éléments</span>}
      </div>
      {showPageSize && onPageSizeChange && (
        <div className="flex items-center space-x-2 text-sm">
          <span>Afficher</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="p-1 rounded border border-gray-300"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>par page</span>
        </div>
      )}
    </div>
  );
};

export default Pagination;
