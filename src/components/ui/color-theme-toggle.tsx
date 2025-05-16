"use client"
import React, { useState } from "react"
import { useTheme } from "../contexts/ThemeContext"
import { Button } from "./button"
import { Palette } from "lucide-react"
import { cn } from "../../lib/utils"

export function ColorThemeToggle() {
  const { colorTheme, setColorTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const handleColorThemeChange = (theme: "green" | "blue" | "purple" | "amber") => {
    console.log("Changing color theme to:", theme)
    setColorTheme(theme)
    setIsOpen(false)

    // Ajouter un effet visuel pour montrer que le thème a changé
    const body = document.body
    body.classList.add("theme-transition")

    // Vérifier que le thème a bien été appliqué
    setTimeout(() => {
      const currentTheme = document.documentElement.getAttribute("data-color-theme")
      console.log("Current color theme attribute:", currentTheme)

      // Retirer la classe après l'animation
      setTimeout(() => {
        body.classList.remove("theme-transition")
      }, 1000)
    }, 100)
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleDropdown}
        aria-label="Change color theme"
        className="rounded-full"
      >
        <Palette className={cn(
          "h-5 w-5 transition-colors",
          colorTheme === "green" && "text-green-500",
          colorTheme === "blue" && "text-blue-500",
          colorTheme === "purple" && "text-purple-500",
          colorTheme === "amber" && "text-amber-500"
        )} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-md border bg-card p-2 shadow-md z-50">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleColorThemeChange("green")}
              className={cn(
                "flex h-8 w-full items-center justify-center rounded-md transition-colors",
                colorTheme === "green"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 ring-2 ring-green-500"
                  : "hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900 dark:hover:text-green-300"
              )}
            >
              <div className="h-4 w-4 rounded-full bg-green-500 mr-2" />
              Green
            </button>
            <button
              onClick={() => handleColorThemeChange("blue")}
              className={cn(
                "flex h-8 w-full items-center justify-center rounded-md transition-colors",
                colorTheme === "blue"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 ring-2 ring-blue-500"
                  : "hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-300"
              )}
            >
              <div className="h-4 w-4 rounded-full bg-blue-500 mr-2" />
              Blue
            </button>
            <button
              onClick={() => handleColorThemeChange("purple")}
              className={cn(
                "flex h-8 w-full items-center justify-center rounded-md transition-colors",
                colorTheme === "purple"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 ring-2 ring-purple-500"
                  : "hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900 dark:hover:text-purple-300"
              )}
            >
              <div className="h-4 w-4 rounded-full bg-purple-500 mr-2" />
              Purple
            </button>
            <button
              onClick={() => handleColorThemeChange("amber")}
              className={cn(
                "flex h-8 w-full items-center justify-center rounded-md transition-colors",
                colorTheme === "amber"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 ring-2 ring-amber-500"
                  : "hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900 dark:hover:text-amber-300"
              )}
            >
              <div className="h-4 w-4 rounded-full bg-amber-500 mr-2" />
              Amber
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
