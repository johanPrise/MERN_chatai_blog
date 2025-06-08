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

// MUI Theme wrapper component that syncs with our app theme
const MUIThemeWrapper = ({ children }) => {
  const { theme } = useTheme();

  // Create MUI theme based on current app theme
  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: theme === 'dark' ? 'dark' : 'light',
      primary: {
        main: theme === 'dark' ? '#4ade80' : '#22c55e', // Green color from Tailwind
      },
      secondary: {
        main: theme === 'dark' ? '#60a5fa' : '#3b82f6', // Blue color from Tailwind
      },
      background: {
        default: theme === 'dark' ? '#0f172a' : '#F8F7F4',
        paper: theme === 'dark' ? '#1e293b' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
  }), [theme]);

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
    <CustomThemeProvider>
      <MUIThemeWrapper>
        <UserContextProvider>
          <BrowserRouter>
            <DevSupport ComponentPreviews={ComponentPreviews} useInitialHook={useInitial}>
              <App />
              <Toaster />
            </DevSupport>
          </BrowserRouter>
        </UserContextProvider>
      </MUIThemeWrapper>
    </CustomThemeProvider>
  </React.StrictMode>,
)

