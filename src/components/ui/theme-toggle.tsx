"use client"
import { useTheme } from "../../contexts/ThemeContext"
import { Button } from "./button"
import { Sun, Moon } from "lucide-react"
import React from "react"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="rounded-full">
      {theme === "dark" ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
    </Button>
  )
}

