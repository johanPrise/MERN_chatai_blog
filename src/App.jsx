import CategoryPage from "./pages/Category";
import "./css/App.css";
import Home from "./pages/Home";
import PostPage from "./pages/Post";
import { Routes, Route } from "react-router-dom";
import CreatePost from "./pages/createPost";
import Register from "./pages/Register";
import Login from "./pages/Login";
import { UserContextProvider } from "./UserContext.tsx";
import Header from "./components/header.tsx"
import EditPost from "./pages/EditPost";
import Chatbot from './components/Chatbot';
import CreateCategory from "./pages/createCategory.tsx";
import DeleteCategories from "./pages/DelCategory.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx"
import ResetPassword from "./pages/ResetPassword.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import EditUsername from "./pages/ChangeUsername.tsx";

/**
 * Renders the main application component with various routes and components.
 *
 * @return {JSX.Element} The rendered main application component.
 */
function App() {
  return (
    <>
      <UserContextProvider>
        <div className="font-sans font-semibold bg-[#F8F7F4] dark:bg-blue-900 ">
          <Header />
          <Routes>
            <Route index element={<Home />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/deleteCategory" element={<DeleteCategories />} />
            <Route path="/create_category" element={<CreateCategory />} /> {/* Ajout de la route pour la création de catégorie */}
            <Route path="/Post/:id" element={<PostPage />} />
            <Route path="/create_post" element={<CreatePost />} />
            <Route path="/register_page" element={<Register />} />
            <Route path="/login_page" element={<Login />} />
            <Route path="/forgot_password" element={<ForgotPassword />} />
                      <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
                      <Rpute path="/edit-username" element={<EditUsername/>} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/edit_page/:id" element={<EditPost />} />
          </Routes>
          <Chatbot /> {/* Ajout du composant Chatbot */}
        </div>
      </UserContextProvider>
    </>
  );
}

export default App;