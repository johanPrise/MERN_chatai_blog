import { useState, useCallback, useEffect } from 'react'
import { useGlobalErrorHandler } from './useGlobalErrorHandler'
import { contentFilterService, FilterWord, ContentFilterConfig } from '../services/contentFilter'

interface UseContentFilterAdminReturn {
  // Configuration
  config: ContentFilterConfig
  updateConfig: (updates: Partial<ContentFilterConfig>) => void
  resetConfig: () => void
  
  // Filter words management
  filterWords: FilterWord[]
  addFilterWord: (word: Omit<FilterWord, 'id' | 'createdAt' | 'updatedAt'>) => FilterWord
  updateFilterWord: (id: string, updates: Partial<Omit<FilterWord, 'id' | 'createdAt'>>) => FilterWord | null
  removeFilterWord: (id: string) => boolean
  getFilterWordsByCategory: (category: string) => FilterWord[]
  
  // Statistics
  stats: {
    totalWords: number
    activeWords: number
    categoryCounts: Record<string, number>
    severityCounts: Record<string, number>
  }
  
  // State
  isLoading: boolean
  error: string | null
  clearError: () => void
}

/**
 * Hook for content filter administration with centralized error handling
 * Provides comprehensive admin functionality for content filtering
 */
export const useContentFilterAdmin = (): UseContentFilterAdminReturn => {
  const [config, setConfig] = useState<ContentFilterConfig>(contentFilterService.getConfig())
  const [filterWords, setFilterWords] = useState<FilterWord[]>(contentFilterService.getFilterWords())
  const [stats, setStats] = useState(contentFilterService.getStats())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { handleContentFilterError } = useGlobalErrorHandler()

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Refresh data from service
  const refreshData = useCallback(() => {
    try {
      setConfig(contentFilterService.getConfig())
      setFilterWords(contentFilterService.getFilterWords())
      setStats(contentFilterService.getStats())
    } catch (err) {
      const errorMessage = 'Failed to refresh content filter data'
      setError(errorMessage)
      handleContentFilterError('refresh_data', {
        context: { 
          component: 'useContentFilterAdmin', 
          action: 'refresh_data',
          userId: undefined
        },
        showToUser: true,
        logToConsole: true
      })
    }
  }, [handleContentFilterError])

  // Update configuration
  const updateConfig = useCallback((updates: Partial<ContentFilterConfig>) => {
    try {
      setIsLoading(true)
      contentFilterService.updateConfig(updates)
      refreshData()
      setError(null)
    } catch (err) {
      const errorMessage = 'Failed to update configuration'
      setError(errorMessage)
      handleContentFilterError('update_config', {
        context: { 
          component: 'useContentFilterAdmin', 
          action: 'update_config',
          userId: undefined
        },
        showToUser: true,
        logToConsole: true
      })
    } finally {
      setIsLoading(false)
    }
  }, [refreshData, handleContentFilterError])

  // Reset configuration
  const resetConfig = useCallback(() => {
    try {
      setIsLoading(true)
      contentFilterService.resetConfig()
      refreshData()
      setError(null)
    } catch (err) {
      const errorMessage = 'Failed to reset configuration'
      setError(errorMessage)
      handleContentFilterError('reset_config', {
        context: { 
          component: 'useContentFilterAdmin', 
          action: 'reset_config',
          userId: undefined
        },
        showToUser: true,
        logToConsole: true
      })
    } finally {
      setIsLoading(false)
    }
  }, [refreshData, handleContentFilterError])

  // Add filter word
  const addFilterWord = useCallback((word: Omit<FilterWord, 'id' | 'createdAt' | 'updatedAt'>): FilterWord => {
    try {
      setIsLoading(true)
      const newWord = contentFilterService.addFilterWord(word)
      refreshData()
      setError(null)
      return newWord
    } catch (err) {
      const errorMessage = 'Failed to add filter word'
      setError(errorMessage)
      handleContentFilterError('add_filter_word', {
        context: { 
          component: 'useContentFilterAdmin', 
          action: 'add_filter_word',
          userId: undefined
        },
        showToUser: true,
        logToConsole: true
      })
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [refreshData, handleContentFilterError])

  // Update filter word
  const updateFilterWord = useCallback((id: string, updates: Partial<Omit<FilterWord, 'id' | 'createdAt'>>): FilterWord | null => {
    try {
      setIsLoading(true)
      const updatedWord = contentFilterService.updateFilterWord(id, updates)
      refreshData()
      setError(null)
      return updatedWord
    } catch (err) {
      const errorMessage = 'Failed to update filter word'
      setError(errorMessage)
      handleContentFilterError('update_filter_word', {
        context: { 
          component: 'useContentFilterAdmin', 
          action: 'update_filter_word',
          userId: undefined
        },
        showToUser: true,
        logToConsole: true
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [refreshData, handleContentFilterError])

  // Remove filter word
  const removeFilterWord = useCallback((id: string): boolean => {
    try {
      setIsLoading(true)
      const success = contentFilterService.removeFilterWord(id)
      if (success) {
        refreshData()
        setError(null)
      } else {
        const errorMessage = 'Cannot remove default filter words'
        setError(errorMessage)
      }
      return success
    } catch (err) {
      const errorMessage = 'Failed to remove filter word'
      setError(errorMessage)
      handleContentFilterError('remove_filter_word', {
        context: { 
          component: 'useContentFilterAdmin', 
          action: 'remove_filter_word',
          userId: undefined
        },
        showToUser: true,
        logToConsole: true
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [refreshData, handleContentFilterError])

  // Get filter words by category
  const getFilterWordsByCategory = useCallback((category: string): FilterWord[] => {
    try {
      return contentFilterService.getFilterWordsByCategory(category)
    } catch (err) {
      handleContentFilterError('get_words_by_category', {
        context: { 
          component: 'useContentFilterAdmin', 
          action: 'get_words_by_category',
          userId: undefined
        },
        showToUser: false,
        logToConsole: true
      })
      return []
    }
  }, [handleContentFilterError])

  // Initialize data on mount
  useEffect(() => {
    refreshData()
  }, [refreshData])

  return {
    config,
    updateConfig,
    resetConfig,
    filterWords,
    addFilterWord,
    updateFilterWord,
    removeFilterWord,
    getFilterWordsByCategory,
    stats,
    isLoading,
    error,
    clearError
  }
}