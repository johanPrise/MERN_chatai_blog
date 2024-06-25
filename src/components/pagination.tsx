import React from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

/**
 * Renders a pagination component with previous and next buttons, and an input field for selecting the current page.
 *
 * @param {PaginationProps} props - The props object containing the current page, total pages, and a function to handle page change.
 * @param {number} props.currentPage - The current page number.
 * @param {number} props.totalPages - The total number of pages.
 * @param {(page: number) => void} props.onPageChange - The function to handle page change.
 * @return {JSX.Element} The pagination component.
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="inline-flex justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-200 bg-stone-200 text-green-500 rtl:rotate-180 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FaArrowLeft className="h-3 w-3" />
        <span className="sr-only">Prev Page</span>
      </button>

      <div>
        <label htmlFor="PaginationPage" className="sr-only">
          Page
        </label>
        <input
          type="number"
          className="h-8 w-12 rounded border border-gray-200 bg-stone-200 p-0 text-center text-xs font-medium text-gray-900 [-moz-appearance:_textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
          min="1"
          max={totalPages}
          value={currentPage}
          onChange={(e) => onPageChange(Number(e.target.value))}
          id="PaginationPage"
        />
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-200 bg-stone-200 text-green-500 rtl:rotate-180 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="sr-only">Next Page</span>
        <FaArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
};

export default Pagination;