import { type ReactNode, useMemo } from "react"
import CssBaseline from "@mui/material/CssBaseline"
import { ThemeProvider as MUIThemeProvider, createTheme } from "@mui/material/styles"
import { useTheme } from "./contexts/ThemeContext"

type MUIThemeWrapperProps = {
  readonly children: ReactNode
}

export function MUIThemeWrapper({ children }: MUIThemeWrapperProps) {
  const { theme, colorTheme } = useTheme()

  const muiTheme = useMemo(() => {
    const getColorByTheme = (colorTheme: string, isDark: boolean) => {
      const colors: Record<string, string> = {
        green: isDark ? "#4ade80" : "#22c55e",
        blue: isDark ? "#60a5fa" : "#3b82f6",
        purple: isDark ? "#a855f7" : "#8b5cf6",
        amber: isDark ? "#fbbf24" : "#f59e0b",
      }

      return colors[colorTheme] || colors.green
    }

    const isDark = theme === "dark"
    const primaryColor = getColorByTheme(colorTheme, isDark)

    return createTheme({
      palette: {
        mode: isDark ? "dark" : "light",
        primary: {
          main: primaryColor,
        },
        secondary: {
          main: isDark ? "#60a5fa" : "#3b82f6",
        },
        background: {
          default: isDark ? "#0f172a" : "#F8F7F4",
          paper: isDark ? "#1e293b" : "#ffffff",
        },
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      },
    })
  }, [theme, colorTheme])

  return (
    <MUIThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  )
}
