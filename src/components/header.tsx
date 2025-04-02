"use client"

import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { UserContext } from "../UserContext"
import { ThemeToggle } from "./ui/theme-toggle"
import { Button } from "./ui/button"
import { Container } from "./ui/container"
import {
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Trash2,
  PenSquare,
  FolderPlus,
  LayoutDashboard,
} from "lucide-react"
import AnimateOnView from "./AnimateOnView"
import React from "react"

const Header = () => {
  const { userInfo, setUserInfo } = UserContext()
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isDropdownOpen, setDropdownOpen] = useState(false)
  const [isAccountDropdownOpen, setAccountDropdownOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [isScrolled, setIsScrolled] = useState(false)
  const navigate = useNavigate()

  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await fetch("https://mern-backend-neon.vercel.app/users/profile", { credentials: "include" })
      if (!response.ok) throw new Error("Failed to fetch user info")
      const userInfo = await response.json()
      setUserInfo(userInfo)
    } catch (error) {
      console.error("Error fetching user info:", error)
    }
  }, [setUserInfo])

  useEffect(() => {
    fetchUserInfo()
  }, [fetchUserInfo])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("https://mern-backend-neon.vercel.app/categories")
        if (!response.ok) throw new Error("Failed to fetch categories")
        const categories = await response.json()
        setCategories(categories)
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const logout = async () => {
    try {
      await fetch("https://mern-backend-neon.vercel.app/auth/logout", { credentials: "include", method: "POST" })
      setUserInfo(null)
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const deleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        const response = await fetch("https://mern-backend-neon.vercel.app/delete-account", {
          method: "DELETE",
          credentials: "include",
        })
        if (response.ok) {
          setUserInfo(null)
          navigate("/")
        } else {
          alert("Failed to delete account. Please try again.")
        }
      } catch (error) {
        console.error("Error deleting account:", error)
        alert("An error occurred. Please try again.")
      }
    }
  }

  const username = userInfo?.username
  const role = userInfo?.role

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur transition-all ${isScrolled ? "shadow-sm" : ""}`}
    >
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-800 dark:text-primary-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                <path d="M2 2l7.586 7.586"></path>
                <circle cx="11" cy="11" r="2"></circle>
              </svg>
              <span className="hidden sm:inline-block">IWOMI BLOG</span>
              {role && (
                <span className="text-xs bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300 px-2 py-0.5 rounded-full">
                  {role}
                </span>
              )}
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <Link
                to="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <div
                className="relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Categories
                  <ChevronDown className="h-4 w-4" />
                </button>
                {isDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-56 rounded-md border bg-card p-2 shadow-md">
                    <div className="grid grid-cols-1 gap-1">
                      {categories.map((category) => (
                        <Link
                          key={category._id}
                          className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent"
                          to={`/category/${category._id}`}
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              {username ? (
                <div className="relative">
                  <button
                    onClick={() => setAccountDropdownOpen(!isAccountDropdownOpen)}
                    className="flex items-center gap-2 rounded-full bg-primary-50 dark:bg-primary-900 px-3 py-1.5 text-sm font-medium text-primary-800 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    {username}
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {isAccountDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md border bg-card p-2 shadow-md">
                      <div className="grid grid-cols-1 gap-1">
                        <Link
                          to="/edit-username"
                          className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Edit Username
                        </Link>
                        <button
                          onClick={deleteAccount}
                          className="flex w-full items-center rounded-md px-3 py-2 text-sm text-left hover:bg-accent"
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          Delete Account
                        </button>

                        {(role === "admin" || role === "author") && (
                          <>
                            <div className="my-1 h-px bg-border" />
                            <Link
                              to="/create_post"
                              className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent"
                            >
                              <PenSquare className="mr-2 h-4 w-4" />
                              Create Post
                            </Link>
                            <Link
                              to="/create_category"
                              className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent"
                            >
                              <FolderPlus className="mr-2 h-4 w-4" />
                              Create Category
                            </Link>
                          </>
                        )}

                        {role === "admin" && (
                          <Link to="/admin" className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        )}

                        <div className="my-1 h-px bg-border" />
                        <button
                          onClick={logout}
                          className="flex w-full items-center rounded-md px-3 py-2 text-sm text-left hover:bg-accent"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login_page">
                    <Button variant="outline" size="sm">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/register_page">
                    <Button size="sm">Sign up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setMenuOpen(!isMenuOpen)}
            className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent md:hidden"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            <span className="sr-only">Toggle menu</span>
          </button>
        </div>
      </Container>

      {/* Mobile menu */}
      {isMenuOpen && (
        <AnimateOnView animation="slide-down" className="md:hidden">
          <div className="border-t">
            <Container>
              <div className="grid grid-cols-1 gap-4 py-4">
                <Link
                  to="/"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                  onClick={() => setMenuOpen(false)}
                >
                  Home
                </Link>
                <div className="rounded-md px-3 py-2">
                  <div className="mb-2 text-sm font-medium">Categories</div>
                  <div className="grid grid-cols-1 gap-1 pl-2">
                    {categories.map((category) => (
                      <Link
                        key={category._id}
                        className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent"
                        to={`/category/${category._id}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {username ? (
                  <>
                    <div className="rounded-md px-3 py-2">
                      <div className="mb-2 text-sm font-medium">Account</div>
                      <div className="grid grid-cols-1 gap-1 pl-2">
                        <Link
                          to="/edit-username"
                          className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent"
                          onClick={() => setMenuOpen(false)}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Edit Username
                        </Link>
                        <button
                          onClick={() => {
                            deleteAccount()
                            setMenuOpen(false)
                          }}
                          className="flex w-full items-center rounded-md px-3 py-2 text-sm text-left hover:bg-accent"
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          Delete Account
                        </button>
                      </div>
                    </div>

                    {(role === "admin" || role === "author") && (
                      <div className="rounded-md px-3 py-2">
                        <div className="mb-2 text-sm font-medium">Content Management</div>
                        <div className="grid grid-cols-1 gap-1 pl-2">
                          <Link
                            to="/create_post"
                            className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent"
                            onClick={() => setMenuOpen(false)}
                          >
                            <PenSquare className="mr-2 h-4 w-4" />
                            Create Post
                          </Link>
                          <Link
                            to="/create_category"
                            className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent"
                            onClick={() => setMenuOpen(false)}
                          >
                            <FolderPlus className="mr-2 h-4 w-4" />
                            Create Category
                          </Link>
                        </div>
                      </div>
                    )}

                    {role === "admin" && (
                      <Link
                        to="/admin"
                        className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent"
                        onClick={() => setMenuOpen(false)}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout()
                        setMenuOpen(false)
                      }}
                      className="flex w-full items-center rounded-md px-3 py-2 text-sm text-left hover:bg-accent"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 p-3">
                    <Link to="/login_page" onClick={() => setMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Log in
                      </Button>
                    </Link>
                    <Link to="/register_page" onClick={() => setMenuOpen(false)}>
                      <Button className="w-full">Sign up</Button>
                    </Link>
                  </div>
                )}

                <div className="flex justify-center p-3">
                  <ThemeToggle />
                </div>
              </div>
            </Container>
          </div>
        </AnimateOnView>
      )}
    </header>
  )
}

export default Header

