import React from "react"
import { Routes, Route } from "react-router-dom"
import "./css/App.css"

// Pages
import Home from "./pages/Home"
import CategoryPage from "./pages/Category"
import PostPage from "./pages/Post"
import CreatePost from "./pages/createPost"
import EditPost from "./pages/EditPost"
import Register from "./pages/Register"
import Login from "./pages/Login"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import AdminDashboard from "./pages/AdminDashboard"
import EditUsername from "./pages/ChangeUsername"
import CreateCategory from "./pages/createCategory"
import DeleteCategories from "./pages/DelCategory"

// Components
import Header from "./components/header"
import Chatbot from "./components/Chatbot"

/**
 * Renders the main application component with various routes and components.
 */
function App(): React.ReactElement {
  return (
    <div className="font-sans font-semibold bg-[#F8F7F4] dark:bg-blue-900 ">
      <Header />
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
      </Routes>
      <Chatbot />
    </div>
  )
}

export default App

