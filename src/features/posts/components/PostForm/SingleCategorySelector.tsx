/**
 * Single Category Selector Component
 * A simplified category selector for single category selection
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '../../../../lib/utils';
import { ChevronDown, Check } from 'lucide-react';

interface Category {
  id?: string;
  _id?: string;
  name: string;
  slug?: string;
  description?: string;
  postCount?: number;
}

interface SingleCategorySelectorProps {
  value?: string;
  onChange: (categoryId: string) => void;
  categories: Category[];
  error?: string;
  className?: string;
  placeholder?: string;
}

export function SingleCategorySelector({
  value,
  onChange,
  categories,
  error,
  className = '',
  placeholder = 'Select a category...',
}: SingleCategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to get category ID (supports both id and _id)
  const getCategoryId = useCallback((category: Category): string => {
    return category.id || category._id || '';
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected category
  const selectedCategory = categories.find(category => getCategoryId(category) === value);

  // Handle dropdown toggle
  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Handle category selection
  const selectCategory = useCallback((categoryId: string) => {
    console.log('Selecting category:', categoryId, 'Current value:', value);
    
    if (!categoryId || typeof categoryId !== 'string') {
      console.error('Invalid category ID:', categoryId);
      return;
    }

    onChange(categoryId);
    setIsOpen(false);
    setSearchTerm('');
  }, [onChange, value]);

  // Handle clear selection
  const clearSelection = useCallback(() => {
    console.log('Clearing selection');
    onChange('');
    setIsOpen(false);
    setSearchTerm('');
  }, [onChange]);

  // Handle search input
  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Create individual category click handlers to avoid closure issues
  const createCategoryClickHandler = useCallback((categoryId: string) => {
    return (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      console.log('Category click handler called with ID:', categoryId);
      
      // Double check the categoryId is valid
      if (!categoryId || typeof categoryId !== 'string') {
        console.error('Invalid category ID in click handler:', categoryId);
        return;
      }
      
      selectCategory(categoryId);
    };
  }, [selectCategory]);

  // Debug: Log categories to see their structure
  useEffect(() => {
    console.log('Categories received:', categories);
    if (categories.length > 0) {
      console.log('First category structure:', categories[0]);
      console.log('First category ID extracted:', getCategoryId(categories[0]));
    }
  }, [categories, getCategoryId]);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 border rounded-md text-sm',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          'border-gray-300 dark:border-gray-600',
          'hover:border-gray-400 dark:hover:border-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500'
        )}
      >
        <span className="text-left truncate">
          {selectedCategory ? selectedCategory.name : placeholder}
        </span>
        <ChevronDown 
          className={cn(
            'h-4 w-4 transition-transform duration-200', 
            isOpen && 'rotate-180'
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchInput}
              placeholder="Search categories..."
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              autoFocus
            />
          </div>

          {/* Category List Container */}
          <div className="max-h-60 overflow-y-auto">
            {/* Clear Selection Option */}
            {selectedCategory && (
              <button
                type="button"
                onClick={clearSelection}
                className="w-full px-3 py-2 text-sm text-left text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
              >
                <span className="italic">✕ Clear selection</span>
              </button>
            )}

            {/* Categories */}
            {filteredCategories.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                {searchTerm ? 'No categories found' : 'No categories available'}
              </div>
            ) : (
              <div>
                {filteredCategories.map((category) => {
                  const categoryId = getCategoryId(category);
                  
                  // Validate category structure
                  if (!category || !categoryId) {
                    console.warn('Invalid category found:', category);
                    return null;
                  }

                  const isSelected = value === categoryId;
                  
                  return (
                    <button
                      key={`category-${categoryId}`}
                      type="button"
                      onClick={createCategoryClickHandler(categoryId)}
                      className={cn(
                        'w-full px-3 py-2 text-sm text-left transition-colors duration-150',
                        'flex items-center justify-between',
                        isSelected
                          ? 'bg-primary-50 text-primary-900 dark:bg-primary-900/20 dark:text-primary-100'
                          : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                      )}
                      data-category-id={categoryId} // Add data attribute for debugging
                    >
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className="font-medium truncate">{category.name}</span>
                        {category.description && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {category.description}
                          </span>
                        )}
                        {category.slug && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                            {category.slug}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary-600 dark:text-primary-400 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="truncate">
                {selectedCategory ? `Selected: ${selectedCategory.name}` : 'No category selected'}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Help Text */}
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Select a category for your post
      </p>
    </div>
  );
}