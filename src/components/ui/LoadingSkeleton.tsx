/**
 * Loading Skeleton Components
 * Reusable skeleton components for different layouts
 */

import React from 'react'
import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

interface PostSkeletonProps {
  variant?: "default" | "featured" | "compact" | "list"
  className?: string
}

export function PostSkeleton({ variant = "default", className }: PostSkeletonProps) {
  if (variant === "list") {
    return (
      <div className={cn("rounded-lg border bg-card p-4", className)}>
        <div className="flex gap-4">
          <Skeleton className="w-48 h-32 flex-shrink-0 rounded-lg" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "featured") {
    return (
      <div className={cn("", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <Skeleton className="aspect-[16/10] rounded-xl" />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-8 w-3/4" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div className={cn("rounded-lg border bg-card", className)}>
        <Skeleton className="aspect-[16/9] rounded-t-lg" />
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-6 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      <Skeleton className="h-56 rounded-t-lg" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}

interface PostGridSkeletonProps {
  count?: number
  variant?: "default" | "featured" | "compact" | "list"
  className?: string
}

export function PostGridSkeleton({ 
  count = 6, 
  variant = "default", 
  className 
}: PostGridSkeletonProps) {
  const gridClass = variant === "list" 
    ? "space-y-4" 
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"

  return (
    <div className={cn(gridClass, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <PostSkeleton key={index} variant={variant} />
      ))}
    </div>
  )
}

// Category skeleton
export function CategorySkeleton({ className }: SkeletonProps) {
  return (
    <Skeleton className={cn("h-10 w-24 rounded-full", className)} />
  )
}

// Comment skeleton
export function CommentSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("bg-card rounded-lg p-4 border", className)}>
      <div className="flex items-start space-x-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-6 w-12" />
          </div>
        </div>
      </div>
    </div>
  )
}
