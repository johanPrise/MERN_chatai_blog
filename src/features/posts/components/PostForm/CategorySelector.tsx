/**
 * Category Selector Component
 * Multi-select component for choosing post categories
 */

import React, { useState, useCallback } from 'react';
import { Category } from '../../types/post.types';
import { cn } from '../../../../lib/utils';
import { Check, X, Plus } from 'lucide-react';

interface CategorySelectorProps {
  value: string[];
  onChange: (categories: string[]) => void;
  categories: Category[];
  error?: string;
  maxSelections?: number;
  className?: string;
}

export function CategorySelector({
  value,
  onChange,
  categories,
  error,
  maxSelections = 5,
  className = '',
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected categories
  const selectedCategories = categories.filter(category =>
    value.includes(category.id)
  );

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log('Category select clicked:', categoryId, 'Current value:', value);

    if (value.includes(categoryId)) {
      // Remove category
      const newValue = value.filter(id => id !== categoryId);
      console.log('Removing category, new value:', newValue);
      onChange(newValue);
    } else {
      // Add category (if under limit)
      if (value.length < maxSelections) {
        const newValue = [...value, categoryId];
        console.log('Adding category, new value:', newValue);
        onChange(newValue);
      } else {
        console.log('Max selections reached, not adding');
      }
    }
  }, [value, onChange, maxSelections]);

  // Handle remove category
  const handleRemoveCategory = useCallback((categoryId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    onChange(value.filter(id => id !== categoryId));
  }, [value, onChange]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  return (
    <div className={cn('relative', className)}>
      {/* Selected Categories */}
      {selectedCategories.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map(category => (
              <span
                key={category.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
              >
                {category.name}
                <button
                  type="button"
                  onClick={(e) => handleRemoveCategory(category.id, e)}
                  className="ml-1 p-0.5 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                  title="Remove category"
                  aria-label="Remove category"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          {selectedCategories.length > 1 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between px-3 py-2 border rounded-md text-sm',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            'border-gray-300 dark:border-gray-600',
            'hover:border-gray-400 dark:hover:border-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500'
          )}
        >
          <span className="text-left">
            {selectedCategories.length === 0
              ? 'Select categories...'
              : `${selectedCategories.length} selected`
            }
          </span>
          <Plus className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-45')} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
            {/* Search */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {/* Category List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredCategories.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  {searchTerm ? 'No categories found' : 'No categories available'}
                </div>
              ) : (
                filteredCategories.map(category => {
                  const isSelected = value.includes(category.id);
                  const isDisabled = !isSelected && value.length >= maxSelections;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isDisabled) {
                          handleCategorySelect(category.id, e);
                        }
                      }}
                      disabled={isDisabled}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors',
                        isSelected
                          ? 'bg-primary-50 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                          : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700',
                        isDisabled && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center">
                        <span>{category.name}</span>
                        {category.description && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            {category.description}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {selectedCategories.length} of {maxSelections} selected
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Help Text */}
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Select up to {maxSelections} categories for your post
      </p>
    </div>
  );
}
