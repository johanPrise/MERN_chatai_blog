"use client"

// Fichier ES6 TSX
import React from "react"
import { useRef, useState, useEffect } from "react"
import { AnimateOnViewProps } from "../types/AnimateOnViewProps"



/**
 * Function that animates the children when they come into view.
 *
 * @param {AnimateOnViewProps} children - The children components to animate.
 * @return {JSX.Element} The animated component.
 */
const AnimateOnView: React.FC<AnimateOnViewProps> = ({
  children,
  animation = "fade",
  duration = 500,
  delay = 0,
  threshold = 0.1,
  className = "",
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold])

  const getAnimationClass = () => {
    if (!inView) {
      switch (animation) {
        case "fade":
          return "opacity-0"
        case "slide-up":
          return "opacity-0 translate-y-10"
        case "slide-down":
          return "opacity-0 -translate-y-10"
        case "slide-left":
          return "opacity-0 translate-x-10"
        case "slide-right":
          return "opacity-0 -translate-x-10"
        case "zoom":
          return "opacity-0 scale-95"
        case "bounce":
          return "opacity-0 -translate-y-4"
        default:
          return "opacity-0"
      }
    }
    return ""
  }

  return (
    <div
      ref={ref}
      className={`transition-all ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: animation === "bounce" ? "cubic-bezier(0.4, 0, 0.2, 1)" : "ease-out",
      }}
      data-animate={animation}
      data-in-view={inView}
    >
      <div
        className={`${getAnimationClass()} transition-all`}
        style={{
          transitionDuration: `${duration}ms`,
          transitionDelay: `${delay}ms`,
          transitionTimingFunction: animation === "bounce" ? "cubic-bezier(0.4, 0, 0.2, 1)" : "ease-out",
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default AnimateOnView

