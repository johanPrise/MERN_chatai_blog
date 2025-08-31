/**
 * Content Filter Administration Interface
 * Allows administrators to manage content filtering settings and filter words
 */

import React, { useState, useCallback } from 'react';
import { useContentFilterAdmin } from '../../hooks/useContentFilterAdmin';
import { FilterWord } from '../../services/contentFilter';
import { cn } from '../../lib/utils';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  Filter,
  BarChart3,
} from 'lucide-react';

interface ContentFilterAdminProps {
  className?: string;
}

export function ContentFilterAdmin({ className = '' }: ContentFilterAdminProps) {
  const {
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
  } = useContentFilterAdmin();

  // Local state
  const [activeTab, setActiveTab] = useState<'settings' | 'words' | 'stats'>('settings');
  const [editingWord, setEditingWord] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Form state for adding/editing words
  const [wordForm, setWordForm] = useState({
    word: '',
    replacement: '',
    severity: 'moderate' as 'mild' | 'moderate' | 'severe',
    category: 'profanity',
    isActive: true,
  });

  // Test content state
  const [testContent, setTestContent] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  // Handle configuration updates
  const handleConfigUpdate = useCallback(
    (key: string, value: any) => {
      updateConfig({ [key]: value });
    },
    [updateConfig]
  );

  // Handle adding a new filter word
  const handleAddWord = useCallback(() => {
    if (!wordForm.word.trim()) return;

    try {
      addFilterWord({
        word: wordForm.word.trim().toLowerCase(),
        replacement: wordForm.replacement.trim() || '*'.repeat(wordForm.word.length),
        severity: wordForm.severity,
        category: wordForm.category,
        isActive: wordForm.isActive,
      });

      // Reset form
      setWordForm({
        word: '',
        replacement: '',
        severity: 'moderate',
        category: 'profanity',
        isActive: true,
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to add filter word:', err);
    }
  }, [wordForm, addFilterWord]);

  // Handle editing a filter word
  const handleEditWord = useCallback(
    (id: string) => {
      const word = filterWords.find(w => w.id === id);
      if (word) {
        setWordForm({
          word: word.word,
          replacement: word.replacement,
          severity: word.severity,
          category: word.category,
          isActive: word.isActive,
        });
        setEditingWord(id);
      }
    },
    [filterWords]
  );

  // Handle updating a filter word
  const handleUpdateWord = useCallback(() => {
    if (!editingWord) return;

    updateFilterWord(editingWord, {
      word: wordForm.word.trim().toLowerCase(),
      replacement: wordForm.replacement.trim() || '*'.repeat(wordForm.word.length),
      severity: wordForm.severity,
      category: wordForm.category,
      isActive: wordForm.isActive,
      updatedAt: new Date(),
    });

    setEditingWord(null);
    setWordForm({
      word: '',
      replacement: '',
      severity: 'moderate',
      category: 'profanity',
      isActive: true,
    });
  }, [editingWord, wordForm, updateFilterWord]);

  // Handle removing a filter word
  const handleRemoveWord = useCallback(
    (id: string) => {
      if (window.confirm('Are you sure you want to remove this filter word?')) {
        removeFilterWord(id);
      }
    },
    [removeFilterWord]
  );

  // Filter words based on search and filters
  const filteredWords = filterWords.filter(word => {
    const matchesSearch =
      word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.replacement.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || word.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || word.severity === selectedSeverity;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  // Test content filtering
  const handleTestContent = useCallback(() => {
    if (!testContent.trim()) return;

    // Import the service directly for testing
    import('../../services/contentFilter').then(({ contentFilterService }) => {
      const result = contentFilterService.filterContent(testContent);
      setTestResult(result);
    });
  }, [testContent]);

  // Render settings tab
  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          General Settings
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="enable-filtering" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Content Filtering
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Turn content filtering on or off globally
              </p>
            </div>
            <button
              id="enable-filtering"
              onClick={() => handleConfigUpdate('enabled', !config.enabled)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                config.enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  config.enabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="strict-mode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Strict Mode
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use exact word matching instead of pattern matching
              </p>
            </div>
            <button
              id="strict-mode"
              onClick={() => handleConfigUpdate('strictMode', !config.strictMode)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                config.strictMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  config.strictMode ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Test Content Filtering
        </h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="test-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Test Content
            </label>
            <textarea
              id="test-content"
              value={testContent}
              onChange={e => setTestContent(e.target.value)}
              placeholder="Enter content to test filtering..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={4}
            />
          </div>

          <button
            onClick={handleTestContent}
            disabled={!testContent.trim()}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50"
          >
            Test Filter
          </button>

          {testResult && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Filter Result</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Was Filtered:</span>{' '}
                  <span className={testResult.wasFiltered ? 'text-orange-600' : 'text-green-600'}>
                    {testResult.wasFiltered ? 'Yes' : 'No'}
                  </span>
                </div>
                {testResult.flaggedWords.length > 0 && (
                  <div>
                    <span className="font-medium">Flagged Words:</span>{' '}
                    <span className="text-orange-600">{testResult.flaggedWords.join(', ')}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium">Filtered Content:</span>
                  <div className="mt-1 p-2 bg-white dark:bg-gray-800 border rounded">
                    {testResult.filteredContent}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Danger Zone</h3>

        <button
          onClick={() => {
            if (
              window.confirm(
                'Are you sure you want to reset all filter settings to default? This cannot be undone.'
              )
            ) {
              resetConfig();
            }
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to Default
        </button>
      </div>
    </div>
  );

  // Render words management tab
  const renderWordsTab = () => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="search-words"
                type="text"
                placeholder="Search words..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                aria-label="Search words"
              />
            </div>

            <select
              id="category-filter"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {config.categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            <select
              id="severity-filter"
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              aria-label="Filter by severity"
            >
              <option value="all">All Severities</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Word
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingWord) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {editingWord ? 'Edit Filter Word' : 'Add Filter Word'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="word-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Word
              </label>
              <input
                id="word-input"
                type="text"
                value={wordForm.word}
                onChange={e => setWordForm(prev => ({ ...prev, word: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Enter word to filter"
              />
            </div>

            <div>
              <label htmlFor="replacement-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Replacement
              </label>
              <input
                id="replacement-input"
                type="text"
                value={wordForm.replacement}
                onChange={e => setWordForm(prev => ({ ...prev, replacement: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Replacement text"
              />
            </div>

            <div>
              <label htmlFor="category-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                id="category-input"
                value={wordForm.category}
                onChange={e => setWordForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {config.categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="severity-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Severity
              </label>
              <select
                id="severity-input"
                value={wordForm.severity}
                onChange={e => setWordForm(prev => ({ ...prev, severity: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={wordForm.isActive}
              onChange={e => setWordForm(prev => ({ ...prev, isActive: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={editingWord ? handleUpdateWord : handleAddWord}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {editingWord ? 'Update' : 'Add'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingWord(null);
                setWordForm({
                  word: '',
                  replacement: '',
                  severity: 'moderate',
                  category: 'profanity',
                  isActive: true,
                });
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Words List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Filter Words ({filteredWords.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Word
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Replacement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredWords.map(word => (
                <tr key={word.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {word.word}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {word.replacement}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800">
                      {word.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        word.severity === 'mild' &&
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                        word.severity === 'moderate' &&
                          'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                        word.severity === 'severe' &&
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      )}
                    >
                      {word.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        word.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      )}
                    >
                      {word.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditWord(word.id)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {!word.id.startsWith('default-') && (
                        <button
                          onClick={() => handleRemoveWord(word.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render statistics tab
  const renderStatsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Words</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalWords}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Words</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.activeWords}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <EyeOff className="h-8 w-8 text-gray-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive Words</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalWords - stats.activeWords}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Words by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.categoryCounts).map(([category, count]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {category}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Words by Severity
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.severityCounts).map(([severity, count]) => (
              <div key={severity} className="flex justify-between items-center">
                <span
                  className={cn(
                    'text-sm capitalize px-2 py-1 rounded-full',
                    severity === 'mild' &&
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                    severity === 'moderate' &&
                      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                    severity === 'severe' &&
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  )}
                >
                  {severity}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className={cn('max-w-6xl mx-auto p-6', className)}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Content Filter Administration
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage content filtering settings and filter words
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'words', label: 'Filter Words', icon: Filter },
            { id: 'stats', label: 'Statistics', icon: BarChart3 },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={cn(
                'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'settings' && renderSettingsTab()}
      {activeTab === 'words' && renderWordsTab()}
      {activeTab === 'stats' && renderStatsTab()}
    </div>
  );
}
