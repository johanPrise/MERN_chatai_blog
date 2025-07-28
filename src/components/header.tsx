"use client"

import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { UserContext } from "../UserContext"
import { ThemeToggle } from "./ui/theme-toggle"
import { ColorThemeToggle } from "./ui/color-theme-toggle"
import { Button } from "./ui/button"
import { Container } from "./ui/container"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible"
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
  Search,
  ChevronRight,
  FileText,
} from "lucide-react"
import AnimateOnView from "./AnimateOnView"
import React from "react"
import { API_ENDPOINTS } from "../config/api.config"
import { cn } from "../lib/utils"

const Header = () => {
  const { userInfo, setUserInfo } = UserContext()
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [isSearchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categories, setCategories] = useState<any[]>([])
  const [isScrolled, setIsScrolled] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const fetchUserInfo = useCallback(async () => {
    try {
      console.log("Fetching user info...")
      const response = await fetch(API_ENDPOINTS.users.profile, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.log("Failed to fetch user info, status:", response.status)
        throw new Error("Failed to fetch user info")
      }

      const userData = await response.json()
      console.log("User info fetched:", userData)

      if (userData && userData.user) {
        // Si la réponse contient un objet 'user'
        setUserInfo({
          id: userData.user._id,
          username: userData.user.username,
          role: userData.user.role,
        })
      } else if (userData && userData._id) {
        // Si la réponse contient directement les données utilisateur
        setUserInfo({
          id: userData._id,
          username: userData.username,
          role: userData.role,
        })
      } else {
        console.error("Invalid user data format:", userData)
      }
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
        const response = await fetch(API_ENDPOINTS.categories.list)
        if (!response.ok) throw new Error("Failed to fetch categories")
        const data = await response.json()
        // Correction : s'assurer que c'est bien un tableau
        setCategories(Array.isArray(data.categories) ? data.categories : Array.isArray(data) ? data : [])
      } catch (error) {
        setCategories([])
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
      await fetch(API_ENDPOINTS.auth.logout, { credentials: "include", method: "POST" })
      setUserInfo(null)
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const deleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        const response = await fetch(API_ENDPOINTS.users.deleteAccount, {
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

  // Fonction pour vérifier si un lien est actif
  const isActive = useCallback(
    (path: string) => {
      if (path === "/" && location.pathname === "/") {
        return true
      }
      if (path !== "/" && location.pathname.startsWith(path)) {
        return true
      }
      return false
    },
    [location.pathname]
  )

  // Fonction pour gérer la recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery("")
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        "bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60",
        "max-w-[100vw] ",
        isScrolled 
          ? "shadow-lg shadow-black/5 border-border/50" 
          : "shadow-none border-transparent"
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between w-full min-w-0">
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
                className={cn(
                  "text-sm font-medium transition-all relative",
                  isActive("/")
                    ? "text-foreground after:absolute after:bottom-[-1.5px] after:left-0 after:h-[2px] after:w-full after:bg-primary after:content-['']"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Home
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1 text-sm font-medium transition-all",
                      location.pathname.includes("/category")
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Categories
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Post Categories</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Array.isArray(categories) &&
                    categories.map((category) => (
                      <DropdownMenuItem key={category._id} asChild>
                        <Link
                          className="flex items-center"
                          to={`/category/${category._id}`}
                        >
                          {category.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Barre de recherche */}
            <div className="relative">
              <button
                onClick={() => setSearchOpen(!isSearchOpen)}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {isSearchOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-md dropdown-menu p-2 animate-in fade-in slide-in-from-top-5 duration-200 z-50 search-dropdown">
                  <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative flex-1 min-w-0">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search articles..."
                        className="w-full rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        autoFocus
                      />
                    </div>
                    <Button type="submit" size="sm" className="flex-shrink-0">
                      Search
                    </Button>
                  </form>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <ColorThemeToggle />
              <ThemeToggle />

              {username ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full bg-primary-50 dark:bg-primary-900 px-3 py-1.5 text-sm font-medium text-primary-800 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-800 transition-all duration-200 hover:shadow-md">
                      <User className="h-4 w-4" />
                      {username}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/edit-username" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Username
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={deleteAccount} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </DropdownMenuItem>

                    {(role === "admin" || role === "author") && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Content</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link to="/create_post" className="flex items-center">
                            <PenSquare className="mr-2 h-4 w-4" />
                            Create Post (Legacy)
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/posts/create" className="flex items-center">
                            <PenSquare className="mr-2 h-4 w-4" />
                            Create Post (New)
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/posts/drafts" className="flex items-center">
                            <FileText className="mr-2 h-4 w-4" />
                            My Drafts
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/create_category" className="flex items-center">
                            <FolderPlus className="mr-2 h-4 w-4" />
                            Create Category
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    {role === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login_page">
                    <Button
                      variant="outline"
                      size="sm"
                      className="transition-all duration-200 hover:shadow-md"
                    >
                      Log in
                    </Button>
                  </Link>
                  <Link to="/register_page">
                    <Button
                      size="sm"
                      className="transition-all duration-200 hover:shadow-md"
                    >
                      Sign up
                    </Button>
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
          <div className="border-t w-full max-w-[100vw] overflow-x-hidden">
            <Container>
              {/* Barre de recherche mobile */}
              <div className="py-4 border-b w-full">
                <form onSubmit={handleSearch} className="flex items-center gap-2 w-full">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search articles..."
                      className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-0"
                    />
                  </div>
                  <Button type="submit" size="sm" onClick={() => setMenuOpen(false)} className="flex-shrink-0">
                    Search
                  </Button>
                </form>
              </div>

              <div className="grid grid-cols-1 gap-4 py-4 w-full overflow-x-hidden">
                <Link
                  to="/"
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive("/") ? "bg-accent/50 font-medium" : "hover:bg-accent"
                  )}
                  onClick={() => setMenuOpen(false)}
                >
                  Home
                </Link>
                <Collapsible className="rounded-md px-3 py-2">
                  <CollapsibleTrigger className="flex w-full items-center justify-between">
                    <div
                      className={cn(
                        "text-sm font-medium",
                        location.pathname.includes("/category") && "text-primary"
                      )}
                    >
                      Categories
                    </div>
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 ui-open:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="grid grid-cols-1 gap-1 pl-2">
                      {Array.isArray(categories) &&
                        categories.map((category) => (
                          <Link
                            key={category._id}
                            className={cn(
                              "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                              location.pathname === `/category/${category._id}`
                                ? "bg-accent/50 font-medium"
                                : "hover:bg-accent"
                            )}
                            to={`/category/${category._id}`}
                            onClick={() => setMenuOpen(false)}
                          >
                            {category.name}
                          </Link>
                        ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {username ? (
                  <>
                    <div className="rounded-md px-3 py-2">
                      <div className="mb-2 text-sm font-medium">Account</div>
                      <div className="grid grid-cols-1 gap-1 pl-2">
                        <Link
                          to="/edit-username"
                          className={cn(
                            "flex items-center rounded-md px-3 py-2 text-sm transition-colors group",
                            location.pathname === "/edit-username" ? "bg-accent/50 font-medium" : "hover:bg-accent"
                          )}
                          onClick={() => setMenuOpen(false)}
                        >
                          <Settings className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-45" />
                          Edit Username
                        </Link>
                        <button
                          onClick={() => {
                            deleteAccount()
                            setMenuOpen(false)
                          }}
                          className="flex w-full items-center rounded-md px-3 py-2 text-sm text-left hover:bg-accent transition-colors group"
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-destructive transition-transform duration-200 group-hover:scale-110" />
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
                            className={cn(
                              "flex items-center rounded-md px-3 py-2 text-sm transition-colors group",
                              location.pathname === "/create_post" ? "bg-accent/50 font-medium" : "hover:bg-accent"
                            )}
                            onClick={() => setMenuOpen(false)}
                          >
                            <PenSquare className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                            Create Post (Legacy)
                          </Link>
                          <Link
                            to="/posts/create"
                            className={cn(
                              "flex items-center rounded-md px-3 py-2 text-sm transition-colors group",
                              location.pathname === "/posts/create" ? "bg-accent/50 font-medium" : "hover:bg-accent"
                            )}
                            onClick={() => setMenuOpen(false)}
                          >
                            <PenSquare className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                            Create Post (New)
                          </Link>
                          <Link
                            to="/posts/drafts"
                            className={cn(
                              "flex items-center rounded-md px-3 py-2 text-sm transition-colors group",
                              location.pathname === "/posts/drafts" ? "bg-accent/50 font-medium" : "hover:bg-accent"
                            )}
                            onClick={() => setMenuOpen(false)}
                          >
                            <FileText className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                            My Drafts
                          </Link>
                          <Link
                            to="/create_category"
                            className={cn(
                              "flex items-center rounded-md px-3 py-2 text-sm transition-colors group",
                              location.pathname === "/create_category" ? "bg-accent/50 font-medium" : "hover:bg-accent"
                            )}
                            onClick={() => setMenuOpen(false)}
                          >
                            <FolderPlus className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                            Create Category
                          </Link>
                        </div>
                      </div>
                    )}

                    {role === "admin" && (
                      <Link
                        to="/admin"
                        className={cn(
                          "flex items-center rounded-md px-3 py-2 text-sm transition-colors group",
                          location.pathname === "/admin" ? "bg-accent/50 font-medium" : "hover:bg-accent"
                        )}
                        onClick={() => setMenuOpen(false)}
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout()
                        setMenuOpen(false)
                      }}
                      className="flex w-full items-center rounded-md px-3 py-2 text-sm text-left hover:bg-accent transition-colors group"
                    >
                      <LogOut className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 p-3">
                    <Link to="/login_page" onClick={() => setMenuOpen(false)}>
                      <Button variant="outline" className="w-full transition-all duration-200 hover:shadow-md">
                        Log in
                      </Button>
                    </Link>
                    <Link to="/register_page" onClick={() => setMenuOpen(false)}>
                      <Button className="w-full transition-all duration-200 hover:shadow-md">Sign up</Button>
                    </Link>
                  </div>
                )}

                <div className="flex justify-center gap-4 p-3 border-t">
                  <ColorThemeToggle />
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

