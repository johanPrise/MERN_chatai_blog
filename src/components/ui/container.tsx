import  React from "react"
import { cn } from "../../lib/utils"

interface ContainerProps {
  children: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
}

export function Container({ children, className, size = "lg" }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full ",
        // Mobile-first padding with safe constraints
        "px-4 sm:px-6 lg:px-8",
        // Responsive max-widths with viewport constraints
        {
          "max-w-screen-sm": size === "sm",
          "max-w-screen-md": size === "md", 
          "max-w-screen-lg": size === "lg",
          "max-w-screen-xl": size === "xl",
          "max-w-full": size === "full",
        },
        // Ensure container never exceeds viewport and prevent scroll issues
        "max-w-[100vw] min-w-0",
        // Additional scroll prevention
        "box-border",
        className,
      )}
    >
      <div className="w-full min-w-0 ">
        {children}
      </div>
    </div>
  )
}

