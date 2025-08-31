/**
 * Tag Input Component
 * Input component for adding and managing post tags with autocomplete
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PostApiService } from '../../services/postApi';
import { cn } from '../../../../lib/utils';
import { X, Hash } from 'lucide-react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  maxTagLength?: number;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder = 'Add tags...',
  maxTags = 10,
  maxTagLength = 30,
  className = '',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const apiService = PostApiService.getInstance();

  // Fetch tag suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const suggestions = await apiService.getTagSuggestions(query);
      // Filter out already selected tags
      const filteredSuggestions = suggestions.filter(
        suggestion => !value.includes(suggestion.toLowerCase())
      );
      setSuggestions(filteredSuggestions.slice(0, 5)); // Limit to 5 suggestions
    } catch (error) {
      console.error('Failed to fetch tag suggestions:', error);
      setSuggestions([]);
    }
  }, [value, apiService]);

  // Handle input change
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    setSelectedSuggestionIndex(-1);

    if (newValue.trim()) {
      fetchSuggestions(newValue.trim());
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [fetchSuggestions]);

  // Add tag
  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    
    if (!trimmedTag) return;
    if (trimmedTag.length > maxTagLength) return;
    if (value.includes(trimmedTag)) return;
    if (value.length >= maxTags) return;

    onChange([...value, trimmedTag]);
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  }, [value, onChange, maxTags, maxTagLength]);

  // Remove tag
  const removeTag = useCallback((tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  }, [value, onChange]);

  // Handle key down
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
          addTag(suggestions[selectedSuggestionIndex]);
        } else if (inputValue.trim()) {
          addTag(inputValue);
        }
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (suggestions.length > 0) {
          setSelectedSuggestionIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (suggestions.length > 0) {
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
        }
        break;

      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;

      case 'Backspace':
        if (!inputValue && value.length > 0) {
          removeTag(value[value.length - 1]);
        }
        break;

      case ',':
      case ';':
        event.preventDefault();
        if (inputValue.trim()) {
          addTag(inputValue);
        }
        break;
    }
  }, [inputValue, suggestions, selectedSuggestionIndex, addTag, removeTag, value]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    addTag(suggestion);
  }, [addTag]);

  // Handle input blur
  const handleBlur = useCallback(() => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  }, []);

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (inputValue.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [inputValue, suggestions]);

  // Validate tag format
  const isValidTag = useCallback((tag: string) => {
    return /^[a-zA-Z0-9\-_]+$/.test(tag);
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* Tags Display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            <Hash className="h-3 w-3 mr-1" />
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 p-0.5 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={value.length >= maxTags ? `Maximum ${maxTags} tags` : placeholder}
          disabled={value.length >= maxTags}
          className={cn(
            'w-full px-3 py-2 border rounded-md text-sm',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            'border-gray-300 dark:border-gray-600',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  'w-full flex items-center px-3 py-2 text-sm text-left transition-colors',
                  index === selectedSuggestionIndex
                    ? 'bg-primary-50 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                    : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                <Hash className="h-3 w-3 mr-2 text-gray-400" />
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          Press Enter, comma, or semicolon to add tags
        </span>
        <span>
          {value.length}/{maxTags} tags
        </span>
      </div>

      {/* Validation Message */}
      {inputValue && !isValidTag(inputValue) && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          Tags can only contain letters, numbers, hyphens, and underscores
        </p>
      )}

      {inputValue.length > maxTagLength && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
          Tag must be {maxTagLength} characters or less
        </p>
      )}
    </div>
  );
}
