import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function getImageUrl(path: string): string {
  if (path.startsWith("http")) {
    return path // Already a full URL
  }
  return `/uploads/${path}`
}

export function getOptimizedImageUrl(url: string, width = 800): string {
  return `${url}?width=${width}&quality=80&format=webp`
}

