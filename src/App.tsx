import React from "react"
import { Routes, Route, useLocation } from "react-router-dom"
import "./css/App.css"
import "./css/dark-mode.css"
// Theme initialization removed - now handled by ThemeProvider

// Pages
import Home from "./pages/Home"
import CategoryPage from "./pages/Category"
import PostPage from "./pages/Post"
import { CreatePost } from "./features/posts/pages/CreatePost"
import { EditPost } from "./features/posts/pages/EditPost"
import { Drafts } from "./features/posts/pages/Drafts"
import Register from "./pages/Register"
import Login from "./pages/Login"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import AdminDashboard from "./pages/AdminDashboard"
import EditUsername from "./pages/ChangeUsername"
import CreateCategory from "./pages/createCategory"
import DeleteCategories from "./pages/DelCategory"
import Search from "./pages/Search"
import ComingSoon from "./pages/ComingSoon"


// Components
import Header from "./components/header"
import Chatbot from "./components/Chatbot"
import { ContentFilterAdmin } from "./components/admin/ContentFilterAdmin"
import ErrorBoundary from "./components/ErrorBoundary"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { ErrorProvider } from "./contexts/ErrorContext"
import { Toaster } from "./components/ui/toaster"

/**
 * Renders the main application component with various routes and components.
 * Wrapped with ErrorBoundary and ErrorProvider for global error handling.
 */
function App(): React.ReactElement {
  const location = useLocation()
  // On masque le Header général sur la route /admin pour afficher uniquement AdminHeader dans AdminDashboard
  const isAdminRoute = location.pathname.startsWith("/admin")

  // Theme initialization is now handled by ThemeProvider in main.tsx
  // No need for duplicate initialization here
  
  return (
    <ErrorProvider>
      <ErrorBoundary context={{ component: 'App', action: 'render' }}>
        <div className="font-sans font-semibold bg-background text-foreground min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-hidden">
          {/* Affiche le Header général sauf sur la page admin */}
          {!isAdminRoute && (
            <ErrorBoundary context={{ component: 'Header', action: 'render' }}>
              <Header />
            </ErrorBoundary>
          )}
          <div className="flex-grow w-full min-w-0 overflow-x-hidden pt-16">
            <ErrorBoundary context={{ component: 'Routes', action: 'navigation' }}>
              <Routes>
                <Route index element={<Home />} />
                <Route path="/category/:categoryId" element={<CategoryPage />} />
                <Route path="/posts/:id" element={<PostPage />} />
                {/* Legacy redirect for old /Post/:id links */}
                <Route path="/Post/:id" element={<PostPage />} />
                <Route path="/register_page" element={<Register />} />
                <Route path="/login_page" element={<Login />} />
                <Route path="/forgot_password" element={<ForgotPassword />} />
                <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
                <Route path="/search" element={<Search />} />

                {/* Routes nécessitant une authentification */}
                <Route path="/edit-username" element={<ProtectedRoute><EditUsername /></ProtectedRoute>} />
                <Route path="/posts/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
                {/* Legacy redirect for old /create_post links */}
                <Route path="/create_post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
                <Route path="/posts/edit/:id" element={<ProtectedRoute><EditPost /></ProtectedRoute>} />
                <Route path="/posts/drafts" element={<ProtectedRoute><Drafts /></ProtectedRoute>} />

                {/* Routes réservées aux admins */}
                <Route path="/deleteCategory" element={<ProtectedRoute requiredRole="admin"><DeleteCategories /></ProtectedRoute>} />
                <Route path="/create_category" element={<ProtectedRoute requiredRole="admin"><CreateCategory /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/content-filter" element={<ProtectedRoute requiredRole="admin"><ContentFilterAdmin /></ProtectedRoute>} />
                <Route path="/coming-soon" element={<ComingSoon />} />

              </Routes>
            </ErrorBoundary>
          </div>
          <ErrorBoundary context={{ component: 'Chatbot', action: 'render' }}>
            <Chatbot />
          </ErrorBoundary>
          <Toaster />
        </div>
      </ErrorBoundary>
    </ErrorProvider>
  )
}

export default App

