/**
 * Enhanced Post Form Component
 * Handles all post creation and editing functionality
 */

import React, { useState, useCallback, useEffect } from 'react';
import { MediaUpload } from './MediaUpload';
import { SingleCategorySelector } from './SingleCategorySelector';
import { TagInput } from './TagInput';
import { PostPreview } from '../PostPreview';
import { usePostContext } from '../../context/PostContext';
import { useAutoSave } from '../../hooks/useAutoSave';
import { CreatePostInput, UpdatePostInput, PostStatus, PostVisibility, PostData, ContentBlock } from '../../types/post.types';
import { cn } from '../../../../lib/utils';
import { useSimpleContentFilter } from '../../../../hooks/useContentFilter';
import { Save, Eye, Globe, AlertTriangle } from 'lucide-react';
import TiptapBlockEditor from '../BlockEditor/TiptapBlockEditor';

interface PostFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<PostData>;
  onSubmit?: (data: CreatePostInput | UpdatePostInput) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function PostForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  className = '',
}: PostFormProps) {
  const { state, actions } = usePostContext();

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    summary: initialData?.summary || '',
    content: initialData?.content || '',
    coverImage: initialData?.coverImage || '',
    category: initialData?.categories?.[0]?.id || '', // Use single category
    tags: initialData?.tags || [],
    status: initialData?.status || PostStatus.DRAFT,
    visibility: initialData?.visibility || PostVisibility.PUBLIC,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(initialData?.contentBlocks || []);

  const [contentWarnings, setContentWarnings] = useState<{
    title: string[];
    summary: string[];
    content: string[];
  }>({ title: [], summary: [], content: [] });

  // Content filtering
  const { filterContent, testContent } = useSimpleContentFilter();

  // Update form data when initialData changes (important for edit mode)
  useEffect(() => {
    if (initialData && initialData.id) {
      const newFormData = {
        title: initialData.title || '',
        summary: initialData.summary || '',
        content: initialData.content || '',
        coverImage: initialData.coverImage || '',
        category: initialData.categories?.[0]?.id || '',
        tags: initialData.tags || [],
        status: initialData.status || PostStatus.DRAFT,
        visibility: initialData.visibility || PostVisibility.PUBLIC,
      };

      setFormData(newFormData);

      // Clear any existing errors when loading new data
      setErrors({});
    }
  }, [initialData?.id, initialData?.title, initialData?.summary, initialData?.content]);

  // Keep contentBlocks in sync if initialData changes (edit mode)
  useEffect(() => {
    if (initialData?.contentBlocks) {
      setContentBlocks(initialData.contentBlocks);
    }
  }, [initialData?.contentBlocks]);

  // Additional effect to handle summary specifically (in case it comes later)
  useEffect(() => {
    if (initialData?.summary !== undefined && formData.summary !== initialData.summary) {
      setFormData(prev => ({
        ...prev,
        summary: initialData.summary || ''
      }));
    }
  }, [initialData?.summary]);

  // Auto-save for edit mode
  const {
    isAutoSaving,
    lastSaved,
    hasUnsavedChanges,
    saveNow,
  } = useAutoSave(
    mode === 'edit' ? initialData?.id || null : null,
    formData.content,
    formData.title,
    formData.summary,
    {
      enabled: mode === 'edit',
      maxRetries: 3,
      interval: 30000,
    }
  );

  // Load categories on mount
  useEffect(() => {
    actions.fetchCategories();
  }, [actions]);

  // Check content for inappropriate words
  const checkContentFilter = useCallback((field: string, content: string) => {
    const testResult = testContent(content);
    setContentWarnings(prev => ({
      ...prev,
      [field]: testResult.flaggedWords,
    }));
  }, [testContent]);

  // Update form data with content filtering
  const updateFormData = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Check for inappropriate content in text fields
    if (typeof value === 'string' && ['title', 'summary', 'content'].includes(field)) {
      checkContentFilter(field, value);
    }
  }, [errors, checkContentFilter]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.summary.trim()) {
      newErrors.summary = 'Summary is required';
    } else if (formData.summary.length < 10) {
      newErrors.summary = 'Summary must be at least 10 characters';
    } else if (formData.summary.length > 500) {
      newErrors.summary = 'Summary must be less than 500 characters';
    }

    // Require Tiptap content blocks
    if (!contentBlocks || contentBlocks.length === 0) {
      newErrors.content = 'Content is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, contentBlocks]);

  // Handle form submission
  const handleSubmit = useCallback(async (status?: PostStatus) => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Apply content filtering before submission
      const titleResult = filterContent(formData.title);
      const summaryResult = filterContent(formData.summary);
      const contentResult = filterContent(formData.content);

      // Show notification if content was filtered
      if (titleResult.wasFiltered || summaryResult.wasFiltered || contentResult.wasFiltered) {
        console.log('Content was filtered before submission:', {
          title: titleResult.replacements,
          summary: summaryResult.replacements,
          content: contentResult.replacements,
        });
      }

      const submitData: any = {
        ...formData,
        title: titleResult.filteredContent,
        summary: summaryResult.filteredContent,
        // keep legacy markdown during transition when using old editor
        // We are now tiptap-only: keep legacy markdown empty
        content: '',
        status: status || formData.status,
        // Convert single category to categories array for backend compatibility
        categories: formData.category ? [formData.category] : [],
      };
      submitData.contentBlocks = contentBlocks;

      // Debug: log the payload we are about to submit (contentBlocks length and shape)
      try {
        const dbg = {
          ...submitData,
          // avoid logging full doc tree which can be huge
          contentBlocks: Array.isArray(submitData.contentBlocks)
            ? submitData.contentBlocks.map((b: any) => ({ type: b?.type, hasData: !!b?.data, keys: b?.data ? Object.keys(b.data) : [] }))
            : submitData.contentBlocks,
        };
        console.debug('[PostForm] Submitting post payload', dbg);
      } catch (e) {
        console.debug('[PostForm] Could not serialize submit payload');
      }

      // Remove the single category field to avoid confusion
      delete (submitData as any).category;

      // Backend schema: content has minLength: 1 but is optional.
      // If empty string, omit the field entirely to pass validation.
      if (typeof submitData.content === 'string' && submitData.content.trim().length === 0) {
        delete submitData.content;
      }

      // Backend schema expects coverImage as an object { url, alt } if provided.
      // Our form stores a URL string. Convert or omit if empty.
      if (typeof submitData.coverImage === 'string') {
        if (submitData.coverImage.trim().length > 0) {
          submitData.coverImage = { url: submitData.coverImage, alt: '' };
        } else {
          delete submitData.coverImage;
        }
      }

      if (onSubmit) {
        await onSubmit(submitData);
      } else if (mode === 'create') {
        await actions.createPost(submitData);
      } else if (mode === 'edit' && initialData?.id) {
        // Add id to submitData for UpdatePostInput type compatibility
        const updateData = {
          ...submitData,
          id: initialData.id
        };
        await actions.updatePost(initialData.id, updateData);
      }
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit, mode, actions, initialData, contentBlocks]);

  // Handle save as draft
  const handleSaveDraft = useCallback(() => {
    handleSubmit(PostStatus.DRAFT);
  }, [handleSubmit]);

  // Handle publish
  const handlePublish = useCallback(() => {
    handleSubmit(PostStatus.PUBLISHED);
  }, [handleSubmit]);

  // Handle preview
  const handlePreview = useCallback(() => {
    setShowPreview(true);
  }, []);

  // Handle close preview
  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
  }, []);

  // Get category name for preview
  const getCategoryName = useCallback(() => {
    if (!formData.category || !state.categories) return undefined;
    const category = state.categories.find(cat => cat.id === formData.category);
    return category?.name;
  }, [formData.category, state.categories]);

  return (
    <>
      <div className={cn('max-w-6xl mx-auto p-6', className)}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {mode === 'create' ? 'Create New Post' : 'Edit Post'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {mode === 'create'
              ? 'Write and publish your new blog post'
              : 'Make changes to your existing post'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="Enter your post title..."
                className={cn(
                  'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                  'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                  'border-gray-300 dark:border-gray-600',
                  errors.title && 'border-red-500 focus:ring-red-500'
                )}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
              )}
              {contentWarnings.title.length > 0 && (
                <div className="mt-1 flex items-center text-sm text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span>Content may be filtered: {contentWarnings.title.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Summary */}
            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Summary *
              </label>
              <textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => updateFormData('summary', e.target.value)}
                placeholder="Write a brief summary of your post..."
                rows={3}
                className={cn(
                  'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                  'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                  'border-gray-300 dark:border-gray-600',
                  errors.summary && 'border-red-500 focus:ring-red-500'
                )}
                required
              />
              {errors.summary && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.summary}</p>
              )}
              {contentWarnings.summary.length > 0 && (
                <div className="mt-1 flex items-center text-sm text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span>Content may be filtered: {contentWarnings.summary.join(', ')}</span>
                </div>
              )}
              {/* Debug info for development - can be removed in production */}
              {process.env.NODE_ENV === 'development' && (
                <p className="mt-1 text-xs text-gray-500">
                  Summary length: {formData.summary.length} characters
                </p>
              )}
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content *
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                <div className="p-3">
                  <TiptapBlockEditor
                    value={contentBlocks}
                    onChange={setContentBlocks}
                    placeholder="Write your post with formatting, images, and links..."
                  />
                </div>
              </div>
              {errors.content && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content}</p>
              )}
              {contentWarnings.content.length > 0 && (
                <div className="mt-1 flex items-center text-sm text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span>Content may be filtered: {contentWarnings.content.join(', ')}</span>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Actions</h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {formData.status === PostStatus.PUBLISHED ? 'Update' : 'Publish'}
                </button>

                <button
                  type="button"
                  onClick={handlePreview}
                  className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </button>

                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Auto-save status */}
              {mode === 'edit' && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isAutoSaving && 'Auto-saving...'}
                    {hasUnsavedChanges && !isAutoSaving && 'Unsaved changes'}
                    {lastSaved && !hasUnsavedChanges && `Last saved: ${lastSaved.toLocaleTimeString()}`}
                  </div>
                </div>
              )}
            </div>

            {/* Cover Image */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Cover Image</h3>
              <MediaUpload
                value={formData.coverImage}
                onChange={(url) => updateFormData('coverImage', url)}
                accept="image/*"
                maxSize={5 * 1024 * 1024} // 5MB
                isCoverImage={true}
              />
            </div>

            {/* Category */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Category *</h3>
              <SingleCategorySelector
                value={formData.category}
                onChange={(category) => updateFormData('category', category)}
                categories={state.categories}
                error={errors.category}
              />
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Tags</h3>
              <TagInput
                value={formData.tags}
                onChange={(tags) => updateFormData('tags', tags)}
                placeholder="Add tags..."
              />
            </div>

            {/* Status */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Status</h3>
              <select
                id="status"
                title="Post Status"
                value={formData.status}
                onChange={(e) => updateFormData('status', e.target.value as PostStatus)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value={PostStatus.DRAFT}>Draft</option>
                <option value={PostStatus.PUBLISHED}>Published</option>
                <option value={PostStatus.ARCHIVED}>Archived</option>
              </select>
            </div>

            {/* Visibility */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Visibility</h3>
              <select
                id="visibility"
                title="Post Visibility"
                value={formData.visibility}
                onChange={(e) => updateFormData('visibility', e.target.value as PostVisibility)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value={PostVisibility.PUBLIC}>Public</option>
                <option value={PostVisibility.PRIVATE}>Private</option>
                <option value={PostVisibility.UNLISTED}>Unlisted</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.visibility === PostVisibility.PUBLIC && 'Visible to everyone'}
                {formData.visibility === PostVisibility.PRIVATE && 'Only visible to you'}
                {formData.visibility === PostVisibility.UNLISTED && 'Not listed but accessible with direct link'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PostPreview
          title={formData.title}
          summary={formData.summary}
          content={formData.content}
          contentBlocks={contentBlocks}
          coverImage={formData.coverImage}
          tags={formData.tags}
          categoryName={getCategoryName()}
          onClose={handleClosePreview}
        />
      )}
    </>
  );
}