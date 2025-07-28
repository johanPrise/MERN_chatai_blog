import React, { useMemo } from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./css/index.css"
import { BrowserRouter } from "react-router-dom"
import { DevSupport } from "@react-buddy/ide-toolbox"
import { ComponentPreviews, useInitial } from "./dev"
import { UserContextProvider } from "./UserContext"
import { ThemeProvider as MUIThemeProvider, createTheme } from "@mui/material/styles"
import { ThemeProvider as CustomThemeProvider, useTheme } from "./components/contexts/ThemeContext"
import CssBaseline from "@mui/material/CssBaseline"
import { Toaster } from "./components/ui/sonner"
import ErrorBoundary from "./components/ErrorBoundary"
import { initMobileOptimizations } from "./utils/mobileOptimizations"
import { initPerformanceOptimizations } from "./utils/lazyComponents"

// Initialize mobile and performance optimizations
initMobileOptimizations();
initPerformanceOptimizations();

// MUI Theme wrapper component that syncs with our app theme
const MUIThemeWrapper = ({ children }) => {
  const { theme, colorTheme } = useTheme();

  // Create MUI theme based on current app theme and color theme
  const muiTheme = useMemo(() => {
    const getColorByTheme = (colorTheme: string, isDark: boolean) => {
      const colors = {
        green: isDark ? '#4ade80' : '#22c55e',
        blue: isDark ? '#60a5fa' : '#3b82f6', 
        purple: isDark ? '#a855f7' : '#8b5cf6',
        amber: isDark ? '#fbbf24' : '#f59e0b'
      };
      return colors[colorTheme] || colors.green;
    };

    const isDark = theme === 'dark';
    const primaryColor = getColorByTheme(colorTheme, isDark);

    return createTheme({
      palette: {
        mode: isDark ? 'dark' : 'light',
        primary: {
          main: primaryColor,
        },
        secondary: {
          main: isDark ? '#60a5fa' : '#3b82f6', // Always blue for secondary
        },
        background: {
          default: isDark ? '#0f172a' : '#F8F7F4',
          paper: isDark ? '#1e293b' : '#ffffff',
        },
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      },
    });
  }, [theme, colorTheme]);

  return (
    <MUIThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
};

// Get the root element and assert it's not null
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary context={{ component: 'Root', action: 'app_initialization' }}>
      <CustomThemeProvider>
        <MUIThemeWrapper>
          <UserContextProvider>
            <BrowserRouter>
              <DevSupport ComponentPreviews={ComponentPreviews} useInitialHook={useInitial}>
                <div>
                  <App />
                  <Toaster />
                </div>
              </DevSupport>
            </BrowserRouter>
          </UserContextProvider>
        </MUIThemeWrapper>
      </CustomThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

