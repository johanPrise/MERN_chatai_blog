import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./css/index.css"
import { BrowserRouter } from "react-router-dom"
import { DevSupport } from "@react-buddy/ide-toolbox"
import { ComponentPreviews, useInitial } from "./dev/index.js"
import { UserContextProvider } from "./UserContext"
import { ThemeProvider as MUIThemeProvider, createTheme } from "@mui/material/styles"
import { ThemeProvider as CustomThemeProvider } from "./components/contexts/ThemeContext"
import CssBaseline from "@mui/material/CssBaseline"

// Create MUI theme
const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#F8F7F4',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Make sure CustomThemeProvider is outside MUIThemeProvider to avoid conflicts */}
    <CustomThemeProvider>
      <MUIThemeProvider theme={muiTheme}>
        <CssBaseline />
        <UserContextProvider>
          <BrowserRouter>
            <DevSupport ComponentPreviews={ComponentPreviews} useInitialHook={useInitial}>
              <App />
            </DevSupport>
          </BrowserRouter>
        </UserContextProvider>
      </MUIThemeProvider>
    </CustomThemeProvider>
  </React.StrictMode>,
)

