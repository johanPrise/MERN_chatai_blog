import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./css/index.css"
import { BrowserRouter } from "react-router-dom"
import { DevSupport } from "@react-buddy/ide-toolbox"
import { ComponentPreviews, useInitial } from "./dev/index.js"
import { UserContextProvider } from "./UserContext"
import { ThemeProvider, createTheme } from "@mui/material/styles"

// Define the theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    // Add more color configurations as needed
  },
  // Add more theme configurations as needed
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <UserContextProvider>
        <BrowserRouter>
          <DevSupport ComponentPreviews={ComponentPreviews} useInitialHook={useInitial}>
            <App />
          </DevSupport>
        </BrowserRouter>
      </UserContextProvider>
    </ThemeProvider>
  </React.StrictMode>,
)

