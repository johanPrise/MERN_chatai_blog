export interface AnimateOnViewProps {
  children: React.ReactNode
  animation?: "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "zoom" | "bounce"
  duration?: number
  delay?: number
  threshold?: number
  className?: string
}
