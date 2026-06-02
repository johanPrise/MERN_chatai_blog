/**
 * Enhanced Post Form Component
 * Handles all post creation and editing functionality
 */

import {
  Suspense,
  lazy,
  useState,
  useCallback,
  useEffect,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { MediaUpload } from './MediaUpload';
import { SingleCategorySelector } from './SingleCategorySelector';
import { TagInput } from './TagInput';
import { usePostContext } from '../../context/PostContext';
import { useAutoSave } from '../../hooks/useAutoSave';
import {
  CreatePostInput,
  UpdatePostInput,
  PostStatus,
  PostVisibility,
  PostData,
  ContentBlock,
} from '../../types/post.types';
import { cn } from '../../../../lib/utils';
import { useSimpleContentFilter } from '../../../../hooks/useContentFilter';
import { Save, Eye, Globe, AlertTriangle } from 'lucide-react';
import { showError } from '../../../../lib/toast-helpers';

const TiptapBlockEditor = lazy(() => import('../BlockEditor/TiptapBlockEditor'));
const PostPreview = lazy(() =>
  import('../PostPreview').then(module => ({ default: module.PostPreview }))
);

interface PostFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<PostData>;
  onSubmit?: (data: CreatePostInput | UpdatePostInput) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

type PostFormData = {
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  status: PostStatus;
  visibility: PostVisibility;
};
type PostFormDataField = keyof PostFormData;

type ContentWarnings = {
  title: string[];
  summary: string[];
  content: string[];
};
type FilterableField = keyof ContentWarnings;
type FormErrors = Record<string, string>;

type CoverImagePayload = NonNullable<CreatePostInput['coverImage']>;
type SubmitPostPayload = Omit<CreatePostInput, 'coverImage'> & {
  coverImage?: CoverImagePayload;
  category?: string;
  id?: string;
};
type CategoryOptions = Parameters<typeof SingleCategorySelector>[0]['categories'];

type ContentFilter = ReturnType<typeof useSimpleContentFilter>['filterContent'];
type ContentTester = ReturnType<typeof useSimpleContentFilter>['testContent'];
type PostActions = ReturnType<typeof usePostContext>['actions'];
type SetFormData = Dispatch<SetStateAction<PostFormData>>;
type SetContentBlocks = Dispatch<SetStateAction<ContentBlock[]>>;
type SetFormErrors = Dispatch<SetStateAction<FormErrors>>;

const EMPTY_INITIAL_POST_DATA = Object.freeze({}) as Partial<PostData>;
const EMPTY_FORM_DATA: PostFormData = {
  title: '',
  summary: '',
  content: '',
  coverImage: '',
  category: '',
  tags: [],
  status: PostStatus.DRAFT,
  visibility: PostVisibility.PUBLIC,
};

interface PostFormController {
  stateCategories: CategoryOptions;
  formData: PostFormData;
  errors: FormErrors;
  isSubmitting: boolean;
  showPreview: boolean;
  contentBlocks: ContentBlock[];
  contentWarnings: ContentWarnings;
  isAutoSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  categoryName?: string;
  handleSaveDraft: () => void;
  handlePublish: () => void;
  handlePreview: () => void;
  handleClosePreview: () => void;
  handleTitleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSummaryChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  handleCoverImageChange: (url: string) => void;
  handleCategoryChange: (category: string) => void;
  handleTagsChange: (tags: string[]) => void;
  handleStatusChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  handleVisibilityChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  setContentBlocks: (blocks: ContentBlock[]) => void;
}

const EditorFallback = () => (
  <div className="min-h-[500px] rounded-md border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-6 text-sm text-gray-500 dark:text-gray-400">
    Chargement de l'editeur...
  </div>
);

const PreviewFallback = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 text-sm text-white">
    Chargement de l'aperçu...
  </div>
);

function extractCategoryId(categories: Partial<PostData>['categories'] | string | null | undefined): string {
  if (typeof categories === 'string') return categories;
  if (!categories) return '';

  if (Array.isArray(categories) && categories.length > 0) {
    const category = categories[0] as { id?: string; _id?: string } | string;
    if (typeof category === 'string') return category;
    return category.id || category._id || '';
  }

  const category = categories as { id?: string; _id?: string };
  return category.id || category._id || '';
}

function normalizeCover(coverImage: Partial<PostData>['coverImage'] | { url?: string } | null | undefined): string {
  if (!coverImage) return '';
  if (typeof coverImage === 'string') return coverImage;
  return typeof coverImage.url === 'string' ? coverImage.url : '';
}

function createInitialFormData(initialData?: Partial<PostData>): PostFormData {
  const source = initialData ?? EMPTY_INITIAL_POST_DATA;

  return {
    ...EMPTY_FORM_DATA,
    title: source.title ?? EMPTY_FORM_DATA.title,
    summary: source.summary ?? EMPTY_FORM_DATA.summary,
    content: source.content ?? EMPTY_FORM_DATA.content,
    coverImage: normalizeCover(source.coverImage),
    category: extractCategoryId(source.categories),
    tags: [...(source.tags ?? EMPTY_FORM_DATA.tags)],
    status: source.status ?? EMPTY_FORM_DATA.status,
    visibility: source.visibility ?? EMPTY_FORM_DATA.visibility,
  };
}

function validateTextField(
  value: string,
  minLength: number,
  maxLength: number,
  messages: Readonly<{
    required: string;
    tooShort: string;
    tooLong: string;
  }>
): string | undefined {
  if (!value.trim()) return messages.required;
  if (value.length < minLength) return messages.tooShort;
  if (value.length > maxLength) return messages.tooLong;
  return undefined;
}

function requiredFieldError(value: string, message: string): string | undefined {
  return value.trim() ? undefined : message;
}

function contentBlocksError(contentBlocks: ContentBlock[]): string | undefined {
  return contentBlocks.length > 0 ? undefined : 'Le contenu est requis';
}

function collectValidationErrors(entries: Array<readonly [string, string | undefined]>): FormErrors {
  return entries.reduce<FormErrors>((validationErrors, [field, error]) => {
    if (error) {
      validationErrors[field] = error;
    }

    return validationErrors;
  }, {});
}

function validatePostForm(formData: PostFormData, contentBlocks: ContentBlock[]): FormErrors {
  return collectValidationErrors([
    [
      'title',
      validateTextField(formData.title, 3, 200, {
        required: 'Le titre est requis',
        tooShort: 'Le titre doit contenir au moins 3 caractères',
        tooLong: 'Le titre doit contenir moins de 200 caractères',
      }),
    ],
    [
      'summary',
      validateTextField(formData.summary, 10, 500, {
        required: 'Le résumé est requis',
        tooShort: 'Le résumé doit contenir au moins 10 caractères',
        tooLong: 'Le résumé doit contenir moins de 500 caractères',
      }),
    ],
    ['content', contentBlocksError(contentBlocks)],
    ['category', formData.category ? undefined : 'La catégorie est requise'],
    ['coverImage', requiredFieldError(formData.coverImage, 'L\'image de couverture est requise')],
  ]);
}

function showValidationToast(validationErrors: FormErrors) {
  const toastConfig = [
    ['coverImage', 'Image de couverture manquante'],
    ['title', 'Titre invalide'],
    ['summary', 'Résumé invalide'],
    ['content', 'Contenu manquant'],
    ['category', 'Catégorie manquante'],
  ] as const;

  const firstError = toastConfig.find(([field]) => validationErrors[field]);
  if (firstError) {
    const [field, title] = firstError;
    showError(validationErrors[field], title);
  }
}

function formatCoverImage(
  coverImage: PostFormData['coverImage'],
  fallbackTitle: string
): CoverImagePayload | undefined {
  const trimmedCover = coverImage.trim();
  if (!trimmedCover) return undefined;

  return {
    url: trimmedCover,
    alt: fallbackTitle || 'Cover image',
  };
}

type FilteredSubmissionContent = {
  title: ReturnType<ContentFilter>;
  summary: ReturnType<ContentFilter>;
  content: ReturnType<ContentFilter>;
};

function filterSubmissionContent(
  formData: PostFormData,
  filterContent: ContentFilter
): FilteredSubmissionContent {
  return {
    title: filterContent(formData.title),
    summary: filterContent(formData.summary),
    content: filterContent(formData.content),
  };
}

function hasFilteredSubmissionContent(filteredContent: FilteredSubmissionContent): boolean {
  return Object.values(filteredContent).some(result => result.wasFiltered);
}

function logFilteredSubmissionContent(filteredContent: FilteredSubmissionContent) {
  if (!hasFilteredSubmissionContent(filteredContent)) return;


}

function prepareSubmitPayload(
  formData: PostFormData,
  contentBlocks: ContentBlock[],
  filterContent: ContentFilter,
  status?: PostStatus
): SubmitPostPayload {
  const filteredContent = filterSubmissionContent(formData, filterContent);
  logFilteredSubmissionContent(filteredContent);

  const submitData: SubmitPostPayload = {
    ...formData,
    title: filteredContent.title.filteredContent,
    summary: filteredContent.summary.filteredContent,
    content: '',
    status: status || formData.status,
    categories: formData.category ? [formData.category] : [],
    contentBlocks,
  };

  delete submitData.category;

  if (!submitData.content?.trim()) {
    delete submitData.content;
  }

  const coverImage = formatCoverImage(formData.coverImage, filteredContent.title.filteredContent);
  if (coverImage) {
    submitData.coverImage = coverImage;
  } else {
    delete submitData.coverImage;
  }

  return submitData;
}

function isFilterableField(field: PostFormDataField): field is FilterableField {
  return field === 'title' || field === 'summary' || field === 'content';
}

function toPostStatus(value: string): PostStatus {
  switch (value) {
    case PostStatus.PUBLISHED:
      return PostStatus.PUBLISHED;
    case PostStatus.ARCHIVED:
      return PostStatus.ARCHIVED;
    case PostStatus.SCHEDULED:
      return PostStatus.SCHEDULED;
    default:
      return PostStatus.DRAFT;
  }
}

function toPostVisibility(value: string): PostVisibility {
  switch (value) {
    case PostVisibility.PRIVATE:
      return PostVisibility.PRIVATE;
    case PostVisibility.UNLISTED:
      return PostVisibility.UNLISTED;
    default:
      return PostVisibility.PUBLIC;
  }
}

function PostFormHeader({ mode }: Readonly<{ mode: PostFormProps['mode'] }>) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {mode === 'create' ? 'Create New Post' : 'Edit Post'}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mt-1">
        {mode === 'create'
          ? 'Write and publish your new blog post'
          : 'Make changes to your existing post'}
      </p>
    </div>
  );
}

function FieldWarning({ words }: Readonly<{ words: string[] }>) {
  if (words.length === 0) return null;

  return (
    <div className="mt-1 flex items-center text-sm text-orange-600 dark:text-orange-400">
      <AlertTriangle className="h-4 w-4 mr-1" />
      <span>Content may be filtered: {words.join(', ')}</span>
    </div>
  );
}

function TitleField({
  postId,
  value,
  error,
  warningWords,
  onChange,
}: Readonly<{
  postId?: string;
  value: string;
  error?: string;
  warningWords: string[];
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}>) {
  return (
    <div>
      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Title *
      </label>
      <input
        type="text"
        id="title"
        key={`title-${postId || 'new'}`}
        value={value}
        onChange={onChange}
        placeholder="Enter your post title..."
        className={cn(
          'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          'border-gray-300 dark:border-gray-600',
          error && 'border-red-500 focus:ring-red-500'
        )}
      />
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <FieldWarning words={warningWords} />
    </div>
  );
}

function SummaryField({
  postId,
  value,
  error,
  warningWords,
  onChange,
}: Readonly<{
  postId?: string;
  value: string;
  error?: string;
  warningWords: string[];
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}>) {
  return (
    <div>
      <label htmlFor="summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Summary *
      </label>
      <textarea
        id="summary"
        key={`summary-${postId || 'new'}`}
        value={value}
        onChange={onChange}
        placeholder="Write a brief summary of your post..."
        rows={3}
        className={cn(
          'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          'border-gray-300 dark:border-gray-600',
          error && 'border-red-500 focus:ring-red-500'
        )}
        required
      />
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <FieldWarning words={warningWords} />
      {process.env.NODE_ENV === 'development' && (
        <p className="mt-1 text-xs text-gray-500">
          Summary length: {value.length} characters
        </p>
      )}
    </div>
  );
}

function ContentEditorField({
  blocks,
  error,
  warningWords,
  onChange,
}: Readonly<{
  blocks: ContentBlock[];
  error?: string;
  warningWords: string[];
  onChange: (blocks: ContentBlock[]) => void;
}>) {
  return (
    <div>
      <label htmlFor="content-editor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Content *
      </label>
      <input id="content-editor" type="hidden" />
      <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
        <div className="p-3">
          <Suspense fallback={<EditorFallback />}>
            <TiptapBlockEditor
              value={blocks}
              onChange={onChange}
              placeholder="Write your post with formatting, images, and links..."
            />
          </Suspense>
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <FieldWarning words={warningWords} />
    </div>
  );
}

function MainContentFields({
  postId,
  formData,
  errors,
  contentWarnings,
  contentBlocks,
  onTitleChange,
  onSummaryChange,
  onContentBlocksChange,
}: Readonly<{
  postId?: string;
  formData: PostFormData;
  errors: Record<string, string>;
  contentWarnings: ContentWarnings;
  contentBlocks: ContentBlock[];
  onTitleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSummaryChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onContentBlocksChange: (blocks: ContentBlock[]) => void;
}>) {
  return (
    <div className="lg:col-span-3 space-y-6">
      <TitleField
        postId={postId}
        value={formData.title}
        error={errors.title}
        warningWords={contentWarnings.title}
        onChange={onTitleChange}
      />
      <SummaryField
        postId={postId}
        value={formData.summary}
        error={errors.summary}
        warningWords={contentWarnings.summary}
        onChange={onSummaryChange}
      />
      <ContentEditorField
        blocks={contentBlocks}
        error={errors.content}
        warningWords={contentWarnings.content}
        onChange={onContentBlocksChange}
      />
    </div>
  );
}

function AutoSaveStatus({
  mode,
  isAutoSaving,
  hasUnsavedChanges,
  lastSaved,
}: Readonly<{
  mode: PostFormProps['mode'];
  isAutoSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
}>) {
  if (mode !== 'edit') return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {isAutoSaving && 'Auto-saving...'}
        {hasUnsavedChanges && !isAutoSaving && 'Unsaved changes'}
        {lastSaved && !hasUnsavedChanges && `Last saved: ${lastSaved.toLocaleTimeString()}`}
      </div>
    </div>
  );
}

function ActionPanel({
  mode,
  status,
  isSubmitting,
  isAutoSaving,
  hasUnsavedChanges,
  lastSaved,
  onSaveDraft,
  onPublish,
  onPreview,
  onCancel,
}: Readonly<{
  mode: PostFormProps['mode'];
  status: PostStatus;
  isSubmitting: boolean;
  isAutoSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  onSaveDraft: () => void;
  onPublish: () => void;
  onPreview: () => void;
  onCancel?: () => void;
}>) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Actions</h3>
      <div className="space-y-2">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </button>

        <button
          type="button"
          onClick={onPublish}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
        >
          <Globe className="h-4 w-4 mr-2" />
          {status === PostStatus.PUBLISHED ? 'Update' : 'Publish'}
        </button>

        <button
          type="button"
          onClick={onPreview}
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

      <AutoSaveStatus
        mode={mode}
        isAutoSaving={isAutoSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSaved={lastSaved}
      />
    </div>
  );
}

function SidebarPanel({
  mode,
  formData,
  errors,
  categories,
  isSubmitting,
  isAutoSaving,
  hasUnsavedChanges,
  lastSaved,
  onSaveDraft,
  onPublish,
  onPreview,
  onCancel,
  onCoverImageChange,
  onCategoryChange,
  onTagsChange,
  onStatusChange,
  onVisibilityChange,
}: Readonly<{
  mode: PostFormProps['mode'];
  formData: PostFormData;
  errors: Record<string, string>;
  categories: CategoryOptions;
  isSubmitting: boolean;
  isAutoSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date | null;
  onSaveDraft: () => void;
  onPublish: () => void;
  onPreview: () => void;
  onCancel?: () => void;
  onCoverImageChange: (url: string) => void;
  onCategoryChange: (category: string) => void;
  onTagsChange: (tags: string[]) => void;
  onStatusChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onVisibilityChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}>) {
  return (
    <div className="space-y-6">
      <ActionPanel
        mode={mode}
        status={formData.status}
        isSubmitting={isSubmitting}
        isAutoSaving={isAutoSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSaved={lastSaved}
        onSaveDraft={onSaveDraft}
        onPublish={onPublish}
        onPreview={onPreview}
        onCancel={onCancel}
      />

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Cover Image *</h3>
        <MediaUpload
          value={formData.coverImage}
          onChange={onCoverImageChange}
          accept="image/jpeg,image/png,image/webp"
          maxSize={5 * 1024 * 1024}
          isCoverImage
          hasError={Boolean(errors.coverImage)}
        />
        {errors.coverImage && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.coverImage}</p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Category *</h3>
        <SingleCategorySelector
          value={formData.category}
          onChange={onCategoryChange}
          categories={categories}
          error={errors.category}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Tags</h3>
        <TagInput value={formData.tags} onChange={onTagsChange} placeholder="Add tags..." />
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Status</h3>
        <select
          id="status"
          title="Post Status"
          value={formData.status}
          onChange={onStatusChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value={PostStatus.DRAFT}>Draft</option>
          <option value={PostStatus.PUBLISHED}>Published</option>
          <option value={PostStatus.ARCHIVED}>Archived</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Visibility</h3>
        <select
          id="visibility"
          title="Post Visibility"
          value={formData.visibility}
          onChange={onVisibilityChange}
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
  );
}

function PreviewModal({
  show,
  formData,
  contentBlocks,
  categoryName,
  onClose,
}: Readonly<{
  show: boolean;
  formData: PostFormData;
  contentBlocks: ContentBlock[];
  categoryName?: string;
  onClose: () => void;
}>) {
  if (!show) return null;

  return (
    <Suspense fallback={<PreviewFallback />}>
      <PostPreview
        title={formData.title}
        summary={formData.summary}
        content={formData.content}
        contentBlocks={contentBlocks}
        coverImage={formData.coverImage}
        tags={formData.tags}
        categoryName={categoryName}
        onClose={onClose}
      />
    </Suspense>
  );
}

function usePostFormInitialization(
  initialData: Partial<PostData> | undefined,
  setFormData: SetFormData,
  setContentBlocks: SetContentBlocks,
  setErrors: SetFormErrors
) {
  const [initializedPostId, setInitializedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData?.id || initializedPostId === initialData.id) return;

    setFormData(createInitialFormData(initialData));

    if (initialData.contentBlocks) {
      setContentBlocks(initialData.contentBlocks);
    }

    setErrors({});
    setInitializedPostId(initialData.id);
  }, [initialData, initializedPostId, setContentBlocks, setErrors, setFormData]);
}

function useContentWarningState(testContent: ContentTester) {
  const [contentWarnings, setContentWarnings] = useState<ContentWarnings>({
    title: [],
    summary: [],
    content: [],
  });

  const checkContentFilter = useCallback((field: FilterableField, content: string) => {
    const testResult = testContent(content);
    setContentWarnings(prev => ({
      ...prev,
      [field]: testResult.flaggedWords,
    }));
  }, [testContent]);

  return { contentWarnings, checkContentFilter };
}

function updateChangedField<Field extends PostFormDataField>(
  previousFormData: PostFormData,
  field: Field,
  value: PostFormData[Field]
): PostFormData {
  if (previousFormData[field] === value) return previousFormData;
  return { ...previousFormData, [field]: value };
}

function removeFieldError(errors: FormErrors, field: PostFormDataField): FormErrors {
  if (!errors[field]) return errors;

  const nextErrors = { ...errors };
  delete nextErrors[field];
  return nextErrors;
}

function scheduleContentWarning(
  field: PostFormDataField,
  value: PostFormData[PostFormDataField],
  checkContentFilter: (field: FilterableField, content: string) => void
) {
  if (typeof value !== 'string') return;
  if (!isFilterableField(field)) return;

  setTimeout(() => {
    checkContentFilter(field, value);
  }, 300);
}

function usePostFormUpdater(
  setFormData: SetFormData,
  setErrors: SetFormErrors,
  checkContentFilter: (field: FilterableField, content: string) => void
) {
  return useCallback(<Field extends PostFormDataField>(
    field: Field,
    value: PostFormData[Field]
  ) => {
    setFormData(prev => updateChangedField(prev, field, value));
    setErrors(prev => removeFieldError(prev, field));
    scheduleContentWarning(field, value, checkContentFilter);
  }, [checkContentFilter, setErrors, setFormData]);
}

function useSubmitPostData({
  mode,
  initialData,
  onSubmit,
  actions,
}: Readonly<{
  mode: PostFormProps['mode'];
  initialData?: Partial<PostData>;
  onSubmit?: PostFormProps['onSubmit'];
  actions: PostActions;
}>) {
  return useCallback(async (submitData: SubmitPostPayload) => {
    if (onSubmit) {
      await onSubmit(submitData);
      return;
    }

    if (mode === 'create') {
      await actions.createPost(submitData);
      return;
    }

    if (mode === 'edit' && initialData?.id) {
      await actions.updatePost(initialData.id, { ...submitData, id: initialData.id });
    }
  }, [actions, initialData, mode, onSubmit]);
}

function hasValidationErrors(validationErrors: FormErrors): boolean {
  return Object.keys(validationErrors).length > 0;
}

function usePostSubmitHandler({
  formData,
  contentBlocks,
  filterContent,
  submitPostData,
  setErrors,
  setIsSubmitting,
}: Readonly<{
  formData: PostFormData;
  contentBlocks: ContentBlock[];
  filterContent: ContentFilter;
  submitPostData: (submitData: SubmitPostPayload) => Promise<void>;
  setErrors: SetFormErrors;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
}>) {
  return useCallback(async (status?: PostStatus) => {
    const validationErrors = validatePostForm(formData, contentBlocks);
    setErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) {
      showValidationToast(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = prepareSubmitPayload(formData, contentBlocks, filterContent, status);
      await submitPostData(submitData);
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  }, [contentBlocks, filterContent, formData, setErrors, setIsSubmitting, submitPostData]);
}

function usePostFormActionHandlers(
  handleSubmit: (status?: PostStatus) => Promise<void>,
  setShowPreview: Dispatch<SetStateAction<boolean>>
) {
  const handleSaveDraft = useCallback(() => {
    handleSubmit(PostStatus.DRAFT);
  }, [handleSubmit]);

  const handlePublish = useCallback(() => {
    handleSubmit(PostStatus.PUBLISHED);
  }, [handleSubmit]);

  const handlePreview = useCallback(() => {
    setShowPreview(true);
  }, [setShowPreview]);

  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
  }, [setShowPreview]);

  return {
    handleSaveDraft,
    handlePublish,
    handlePreview,
    handleClosePreview,
  };
}

function usePostFormFieldHandlers(
  updateFormData: <Field extends PostFormDataField>(
    field: Field,
    value: PostFormData[Field]
  ) => void
) {
  const handleTitleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    updateFormData('title', event.target.value);
  }, [updateFormData]);

  const handleSummaryChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    updateFormData('summary', event.target.value);
  }, [updateFormData]);

  const handleCoverImageChange = useCallback((url: string) => {
    updateFormData('coverImage', url);
  }, [updateFormData]);

  const handleCategoryChange = useCallback((category: string) => {
    updateFormData('category', category);
  }, [updateFormData]);

  const handleTagsChange = useCallback((tags: string[]) => {
    updateFormData('tags', tags);
  }, [updateFormData]);

  const handleStatusChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    updateFormData('status', toPostStatus(event.target.value));
  }, [updateFormData]);

  const handleVisibilityChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    updateFormData('visibility', toPostVisibility(event.target.value));
  }, [updateFormData]);

  return {
    handleTitleChange,
    handleSummaryChange,
    handleCoverImageChange,
    handleCategoryChange,
    handleTagsChange,
    handleStatusChange,
    handleVisibilityChange,
  };
}

function getCategoryName(categories: CategoryOptions, selectedCategoryId: string): string | undefined {
  return categories?.find(category => category.id === selectedCategoryId)?.name;
}

function usePostFormController({
  mode,
  initialData,
  onSubmit,
}: Readonly<PostFormProps>) {
  const { state, actions } = usePostContext();
  const [formData, setFormData] = useState<PostFormData>(() => createInitialFormData(initialData));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(initialData?.contentBlocks ?? []);
  const { filterContent, testContent } = useSimpleContentFilter();

  usePostFormInitialization(initialData, setFormData, setContentBlocks, setErrors);

  const {
    isAutoSaving,
    lastSaved,
    hasUnsavedChanges,
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

  useEffect(() => {
    actions.fetchCategories();
  }, [actions]);

  const { contentWarnings, checkContentFilter } = useContentWarningState(testContent);
  const updateFormData = usePostFormUpdater(setFormData, setErrors, checkContentFilter);
  const submitPostData = useSubmitPostData({ mode, initialData, onSubmit, actions });
  const handleSubmit = usePostSubmitHandler({
    formData,
    contentBlocks,
    filterContent,
    submitPostData,
    setErrors,
    setIsSubmitting,
  });
  const actionHandlers = usePostFormActionHandlers(handleSubmit, setShowPreview);
  const fieldHandlers = usePostFormFieldHandlers(updateFormData);

  return {
    stateCategories: state.categories,
    formData,
    errors,
    isSubmitting,
    showPreview,
    contentBlocks,
    contentWarnings,
    isAutoSaving,
    lastSaved,
    hasUnsavedChanges,
    categoryName: getCategoryName(state.categories, formData.category),
    ...actionHandlers,
    ...fieldHandlers,
    setContentBlocks,
  };
}

function PostFormLayout({
  mode,
  initialData,
  onCancel,
  className,
  controller,
}: Readonly<{
  mode: PostFormProps['mode'];
  initialData?: Partial<PostData>;
  onCancel?: () => void;
  className: string;
  controller: PostFormController;
}>) {
  return (
    <>
      <div className={cn('max-w-6xl mx-auto p-6', className)}>
        <PostFormHeader mode={mode} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <MainContentFields
            postId={initialData?.id}
            formData={controller.formData}
            errors={controller.errors}
            contentWarnings={controller.contentWarnings}
            contentBlocks={controller.contentBlocks}
            onTitleChange={controller.handleTitleChange}
            onSummaryChange={controller.handleSummaryChange}
            onContentBlocksChange={controller.setContentBlocks}
          />
          <SidebarPanel
            mode={mode}
            formData={controller.formData}
            errors={controller.errors}
            categories={controller.stateCategories}
            isSubmitting={controller.isSubmitting}
            isAutoSaving={controller.isAutoSaving}
            hasUnsavedChanges={controller.hasUnsavedChanges}
            lastSaved={controller.lastSaved}
            onSaveDraft={controller.handleSaveDraft}
            onPublish={controller.handlePublish}
            onPreview={controller.handlePreview}
            onCancel={onCancel}
            onCoverImageChange={controller.handleCoverImageChange}
            onCategoryChange={controller.handleCategoryChange}
            onTagsChange={controller.handleTagsChange}
            onStatusChange={controller.handleStatusChange}
            onVisibilityChange={controller.handleVisibilityChange}
          />
        </div>
      </div>

      <PreviewModal
        show={controller.showPreview}
        formData={controller.formData}
        contentBlocks={controller.contentBlocks}
        categoryName={controller.categoryName}
        onClose={controller.handleClosePreview}
      />
    </>
  );
}

export function PostForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  className = '',
}: Readonly<PostFormProps>) {
  const controller = usePostFormController({ mode, initialData, onSubmit, className });

  return (
    <PostFormLayout
      mode={mode}
      initialData={initialData}
      onCancel={onCancel}
      className={className}
      controller={controller}
    />
  );
}
