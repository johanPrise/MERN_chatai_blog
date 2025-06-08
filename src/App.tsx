import React from "react"
import { Routes, Route, useLocation } from "react-router-dom"
import "./css/App.css"

// Pages
import Home from "./pages/Home"
import CategoryPage from "./pages/Category"
import PostPage from "./pages/Post"
import CreatePost from "./pages/createPost"
import EditPost from "./pages/EditPost"
// New enhanced post management
import { CreatePost as NewCreatePost } from "./features/posts/pages/CreatePost"
import { EditPost as NewEditPost } from "./features/posts/pages/EditPost"
import Register from "./pages/Register"
import Login from "./pages/Login"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import AdminDashboard from "./pages/AdminDashboard"
import EditUsername from "./pages/ChangeUsername"
import CreateCategory from "./pages/createCategory"
import DeleteCategories from "./pages/DelCategory"
import Search from "./pages/Search"

// Components
import Header from "./components/header"
import Chatbot from "./components/Chatbot"

/**
 * Renders the main application component with various routes and components.
 */
function App(): React.ReactElement {
  const location = useLocation()
  // On masque le Header général sur la route /admin pour afficher uniquement AdminHeader dans AdminDashboard
  const isAdminRoute = location.pathname.startsWith("/admin")
  return (
    <div className="font-sans font-semibold bg-background text-foreground min-h-screen flex flex-col">
      {/* Affiche le Header général sauf sur la page admin */}
      {!isAdminRoute && <Header />}
      <div className="flex-grow">
        <Routes>
          <Route index element={<Home />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/deleteCategory" element={<DeleteCategories />} />
          <Route path="/create_category" element={<CreateCategory />} />
          <Route path="/Post/:id" element={<PostPage />} />
          <Route path="/create_post" element={<CreatePost />} />
          <Route path="/register_page" element={<Register />} />
          <Route path="/login_page" element={<Login />} />
          <Route path="/forgot_password" element={<ForgotPassword />} />
          <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
          <Route path="/edit-username" element={<EditUsername />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/edit_page/:id" element={<EditPost />} />
          <Route path="/search" element={<Search />} />
          {/* New enhanced post management routes */}
          <Route path="/posts/create" element={<NewCreatePost />} />
          <Route path="/posts/edit/:id" element={<NewEditPost />} />
        </Routes>
      </div>
      <Chatbot />
    </div>
  )
}

export default App

