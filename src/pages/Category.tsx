"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import Post from "../components/Post"
import { CategoryCard2 } from "../components/category"
import "../css/categoryPage.css"
import AnimateOnView from "../components/AnimateOnView"
import Pagination from "../components/pagination"
import { CategoryProps } from "../types/CategoryProps"
import { FetchStatus} from "../types/FetchStatus"
import { Post as PostType } from "../types/PostType"
import { API_ENDPOINTS } from "../config/api.config"


const CategoryPage: React.FC = () => {
  // State management
  const [posts, setPosts] = useState<PostType[]>([])
  const [category, setCategory] = useState<CategoryProps | null>(null)
  const [categories, setCategories] = useState<CategoryProps[]>([])
  const [status, setStatus] = useState<{
    posts: FetchStatus
    category: FetchStatus
    categories: FetchStatus
  }>({
    posts: "idle",
    category: "idle",
    categories: "idle",
  })
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const { categoryId } = useParams<{ categoryId: string }>()

  const postsPerPage = 6

  // Filter posts by current category
  const filteredPosts = useMemo(() => {
    if (!category || !posts.length) return []

    return posts.filter((post) => {
      // Vérifier si le post a une catégorie directe qui correspond
      if (post.category && post.category._id === category._id) {
        return true
      }

      // Vérifier si le post a un tableau de catégories qui contient la catégorie actuelle
      if (post.categories && Array.isArray(post.categories)) {
        return post.categories.some(cat => cat._id === category._id)
      }

      return false
    })
  }, [posts, category])

  // Calculate total pages based on filtered posts
  const totalPages = useMemo(() => {
    return Math.ceil(filteredPosts.length / postsPerPage)
  }, [filteredPosts, postsPerPage])

  // Get current posts for pagination
  const currentPosts = useMemo(() => {
    const indexOfLastPost = currentPage * postsPerPage
    const indexOfFirstPost = indexOfLastPost - postsPerPage
    return filteredPosts.slice(indexOfFirstPost, indexOfLastPost)
  }, [filteredPosts, currentPage, postsPerPage])

  // Reset to page 1 when category changes
  useEffect(() => {
    setCurrentPage(1)
  }, [categoryId])

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page)
      // Scroll to top of posts section
      document.querySelector('.posts')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [totalPages])

  // Fetch category data
  const fetchCategory = useCallback(async () => {
    if (!categoryId) return

    setStatus((prev) => ({ ...prev, category: "loading" }))
    setError(null)

    try {
      const response = await fetch(API_ENDPOINTS.categories.detail(categoryId))

      if (!response.ok) {
        throw new Error(`Failed to fetch category: ${response.status}`)
      }

      const data = await response.json()
      // Adapter la réponse si nécessaire
      const categoryData = data.category || data
      setCategory(categoryData)
      setStatus((prev) => ({ ...prev, category: "success" }))
    } catch (error) {
      console.error("Error fetching category:", error)
      setStatus((prev) => ({ ...prev, category: "error" }))
      setError(error instanceof Error ? error.message : "Failed to load category")
    }
  }, [categoryId])

  // Fetch posts data
  const fetchPosts = useCallback(async () => {
    setStatus((prev) => ({ ...prev, posts: "loading" }))

    try {
      // Si nous avons un categoryId, essayons d'abord de récupérer les posts par catégorie
      let url = API_ENDPOINTS.posts.list
      if (categoryId) {
        // Ajouter un paramètre de requête pour filtrer par catégorie
        url = `${url}?category=${categoryId}`
      }

      console.log("Fetching posts from:", url)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`)
      }

      const data = await response.json()
      console.log("Posts data:", data)

      // Adapter la réponse si nécessaire
      const postsData = data.posts || data
      setPosts(postsData)
      setStatus((prev) => ({ ...prev, posts: "success" }))
    } catch (error) {
      console.error("Error fetching posts:", error)
      setStatus((prev) => ({ ...prev, posts: "error" }))
      setError(error instanceof Error ? error.message : "Failed to load posts")
    }
  }, [categoryId])

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    setStatus((prev) => ({ ...prev, categories: "loading" }))

    try {
      const response = await fetch(API_ENDPOINTS.categories.list)

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`)
      }

      const data = await response.json()
      // Adapter la réponse si nécessaire
      const categoriesData = data.categories || data
      setCategories(categoriesData)
      setStatus((prev) => ({ ...prev, categories: "success" }))
    } catch (error) {
      console.error("Error fetching categories:", error)
      setStatus((prev) => ({ ...prev, categories: "error" }))
    }
  }, [])

  // Fetch all data when component mounts or categoryId changes
  useEffect(() => {
    fetchCategory()
    fetchPosts()
    fetchCategories()
  }, [categoryId, fetchCategory, fetchPosts, fetchCategories])

  // Loading state
  const isLoading = status.category === "loading" || status.posts === "loading"

  // Show loading indicator while category is loading
  if (isLoading && !category) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="loader mx-auto mt-8">
          <div className="bg-green-500 h-full rounded-full animate-pulse"></div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-md" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          onClick={() => {
            fetchCategory()
            fetchPosts()
          }}
          className="mt-4 px-4 py-2 bg-lime-600 text-white rounded hover:bg-lime-700 transition"
        >
          Try Again
        </button>
      </div>
    )
  }

  // If category not found
  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <h1 className="text-2xl font-bold text-gray-700 mb-4">Category Not Found</h1>
        <p className="text-gray-600 mb-6">The category you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="px-4 py-2 bg-lime-600 text-white rounded hover:bg-lime-700 transition">
          Return to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="dark:bg-gray-900 format format-sm sm:format-base lg:format-lg format-blue dark:format-invert antialiased p-4">
      <header className="category-header mb-4">
        <div className="Category-text text-center">
          <h1 className="category-title text-4xl font-bold mb-2 text-lime-600">{category.name}</h1>
          <p className="category-description mb-4 text-lime-500">{category.description}</p>
        </div>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex justify-center mb-4">
          <ol className="flex overflow-hidden rounded-md bg-lime-100 text-lime-600">
            <li className="flex items-center">
              <Link
                to="/"
                className="flex h-10 items-center gap-1.5 px-4 transition hover:bg-lime-200 hover:text-lime-700"
                aria-label="Home"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 011 1m-6 0h6"
                  />
                </svg>
                <span className="ms-1.5 text-xs font-medium"> Home </span>
              </Link>
            </li>
            <li className="relative flex items-center">
              <span
                className="absolute inset-y-0 -start-px h-10 w-4 bg-lime-100 [clip-path:_polygon(0_0,_0%_100%,_100%_50%)] rtl:rotate-180"
                aria-hidden="true"
              ></span>
              <span
                className="flex h-10 items-center bg-white pe-4 ps-8 text-xs font-medium transition"
              >
                {category.name}
              </span>
            </li>
          </ol>
        </nav>
      </header>

      <div id="posts" className="posts p-6 grid">
        <div className="grid gap-4 gap-y-[2.75rem] grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {status.posts === "loading" && filteredPosts.length === 0 && (
            <div className="newtons-cradle flex mx-auto mt-8 col-span-full">
              <div className="newtons-cradle__dot"></div>
              <div className="newtons-cradle__dot"></div>
              <div className="newtons-cradle__dot"></div>
              <div className="newtons-cradle__dot"></div>
            </div>
          )}

          {status.posts === "success" && filteredPosts.length === 0 && (
            <div className="text-center col-span-full py-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Posts Found</h3>
              <p className="text-gray-500">There are no posts in this category yet.</p>
            </div>
          )}

          {currentPosts.map((post) => (
            <AnimateOnView key={post._id}>
              <Post post={post} />
            </AnimateOnView>
          ))}
        </div>
      </div>

      {filteredPosts.length > postsPerPage && (
        <div className="pagination flex justify-center mb-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <div className="Categories-container">
        <h2 className="text-2xl font-bold mb-4">All Categories</h2>
        {status.categories === "loading" && categories.length === 0 ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-lime-500"></div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <CategoryCard2
                key={cat._id}
                category={cat}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoryPage

