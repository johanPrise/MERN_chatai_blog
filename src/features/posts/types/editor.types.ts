/**
 * Editor-specific types for the post management system
 */

export interface EditorConfig {
  theme: 'light' | 'dark';
  fontSize: number;
  lineHeight: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  spellCheck: boolean;
  syntaxHighlighting: boolean;
}

export interface EditorPosition {
  line: number;
  column: number;
}

export interface EditorSelection {
  start: EditorPosition;
  end: EditorPosition;
  text: string;
}

export interface EditorAction {
  type: 'insert' | 'delete' | 'replace' | 'format';
  position: EditorPosition;
  content: string;
  selection?: EditorSelection;
}

export interface EditorHistory {
  actions: EditorAction[];
  currentIndex: number;
  maxSize: number;
}

export interface MarkdownToolbarItem {
  id: string;
  label: string;
  icon: string;
  action: string;
  shortcut?: string;
  group: string;
  separator?: boolean;
}

export interface MarkdownToolbarConfig {
  items: MarkdownToolbarItem[];
  groups: string[];
  customItems?: MarkdownToolbarItem[];
}

export interface PreviewConfig {
  enabled: boolean;
  position: 'right' | 'bottom' | 'overlay';
  syncScroll: boolean;
  showToc: boolean;
  highlightCode: boolean;
  renderMath: boolean;
  renderMermaid: boolean;
}

export interface EditorTheme {
  name: string;
  background: string;
  foreground: string;
  selection: string;
  lineHighlight: string;
  cursor: string;
  syntax: {
    keyword: string;
    string: string;
    comment: string;
    number: string;
    operator: string;
  };
}

export interface EditorPlugin {
  name: string;
  version: string;
  enabled: boolean;
  config?: any;
  initialize: (editor: any) => void;
  destroy: () => void;
}

export interface EditorState {
  content: string;
  selection: EditorSelection | null;
  history: EditorHistory;
  isDirty: boolean;
  isReadOnly: boolean;
  language: string;
  config: EditorConfig;
  plugins: EditorPlugin[];
}

export interface EditorCallbacks {
  onChange?: (content: string) => void;
  onSelectionChange?: (selection: EditorSelection) => void;
  onSave?: (content: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onPaste?: (event: ClipboardEvent) => void;
  onDrop?: (event: DragEvent) => void;
}

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  config?: Partial<EditorConfig>;
  callbacks?: EditorCallbacks;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  height?: string | number;
  width?: string | number;
}

export interface MarkdownEditorProps extends EditorProps {
  showPreview?: boolean;
  previewConfig?: Partial<PreviewConfig>;
  toolbarConfig?: Partial<MarkdownToolbarConfig>;
  enableAutoSave?: boolean;
  autoSaveInterval?: number;
  onAutoSave?: (content: string) => Promise<void>;
}

export interface PreviewProps {
  content: string;
  config?: Partial<PreviewConfig>;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  scrollTop?: number;
}

export interface ToolbarProps {
  config: MarkdownToolbarConfig;
  onAction: (action: string, data?: any) => void;
  disabled?: boolean;
  className?: string;
}

// Markdown processing types
export interface MarkdownProcessor {
  parse: (markdown: string) => any;
  render: (ast: any) => string;
  validate: (markdown: string) => ValidationResult;
  extractMetadata: (markdown: string) => any;
  generateToc: (markdown: string) => TocItem[];
}

export interface TocItem {
  id: string;
  title: string;
  level: number;
  anchor: string;
  children?: TocItem[];
}

export interface MarkdownPlugin {
  name: string;
  processor: (ast: any) => any;
  renderer?: (node: any) => string;
}

export interface MarkdownConfig {
  plugins: MarkdownPlugin[];
  options: {
    breaks: boolean;
    linkify: boolean;
    typographer: boolean;
    quotes: string;
    highlight: boolean;
    html: boolean;
  };
}

// Image handling types
export interface ImageUploadConfig {
  maxSize: number; // bytes
  allowedTypes: string[];
  quality: number;
  resize: {
    enabled: boolean;
    maxWidth: number;
    maxHeight: number;
  };
}

export interface ImageInsertData {
  url: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
}

// Auto-completion types
export interface CompletionItem {
  label: string;
  kind: string;
  detail?: string;
  documentation?: string;
  insertText: string;
  range?: EditorSelection;
}

export interface CompletionProvider {
  triggerCharacters: string[];
  provide: (position: EditorPosition, context: string) => CompletionItem[];
}

// Validation types for editor
export interface EditorValidationRule {
  name: string;
  validate: (content: string) => ValidationResult;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  rule: string;
}
