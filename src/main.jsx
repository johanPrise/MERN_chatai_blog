import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./css/index.css"
import { BrowserRouter } from "react-router-dom"
import { DevSupport } from "@react-buddy/ide-toolbox"
import { ComponentPreviews, useInitial } from "./dev/index.js"
import { UserContextProvider } from "./UserContext"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"

// Créer le thème MUI
const theme = createTheme({
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
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#6b6b6b #2b2b2b",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "#2b2b2b",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#6b6b6b",
            minHeight: 24,
            border: "3px solid #2b2b2b",
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
            backgroundColor: "#959595",
          },
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <UserContextProvider>
          <DevSupport ComponentPreviews={ComponentPreviews} useInitialHook={useInitial}>
            <App />
          </DevSupport>
        </UserContextProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)

