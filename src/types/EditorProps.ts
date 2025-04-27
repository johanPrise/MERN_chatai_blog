/**
 * Props for the Editor component
 */
export interface EditorProps {
  /** The current value of the editor */
  value: string
  /** The function to be called when the editor content changes */
  onChange: (content: string) => void
  /** Optional className for additional styling */
  className?: string
}