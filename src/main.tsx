import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./css/index.css"
import "./css/global.css"
import { BrowserRouter } from "react-router-dom"
// React Buddy dev support removed with unused dev directory
// import { DevSupport } from "@react-buddy/ide-toolbox"
// import { ComponentPreviews, useInitial } from "./dev"
import { UserContextProvider } from "./UserContext"
import { ThemeProvider as CustomThemeProvider } from "./components/contexts/ThemeContext"
import ErrorBoundary from "./components/ErrorBoundary"
import { MUIThemeWrapper } from "./components/MUIThemeWrapper"
import { initMobileOptimizations } from "./utils/mobileOptimizations"
import { initPerformanceOptimizations } from "./utils/lazyComponents"
import { filterExtensionErrors } from "./utils/errorFilter"

// Initialize mobile and performance optimizations
initMobileOptimizations();
initPerformanceOptimizations();

// Filter out browser extension errors
filterExtensionErrors();

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
              <App />
            </BrowserRouter>
          </UserContextProvider>
        </MUIThemeWrapper>
      </CustomThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
