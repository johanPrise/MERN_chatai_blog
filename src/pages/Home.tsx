"use client"

import React, { useEffect, useState, useCallback } from "react"
import Featured from "../components/Featured"
import PostComponent from "../components/Post"
import { CategoryCard2 } from "../components/category"
import AnimateOnView from "../components/AnimateOnView"
import Pagination from "../components/pagination"
import { Container } from "../components/ui/container"
import { H1, H2 } from "../components/ui/typography"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Post as PostType } from "../types/PostType"
import { CategoryProps } from "../types/CategoryProps"
import { FetchStatus } from "../types/FetchStatus"
import { API_ENDPOINTS } from "../config/api.config"

// Interface for fetch state
interface FetchState {
  posts: {
    status: FetchStatus
    error: string | null
  }
  categories: {
    status: FetchStatus
    error: string | null
  }
}

export default function Home() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1)
  const postsPerPage = 6

  // Data state
  const [posts, setPosts] = useState<PostType[]>([])
  const [categories, setCategories] = useState<CategoryProps[]>([])
  const [featuredPosts, setFeaturedPosts] = useState<PostType[]>([])

  // UI state
  const [fetchState, setFetchState] = useState<FetchState>({
    posts: { status: "idle", error: null },
    categories: { status: "idle", error: null }
  })

  // Derived state
  const totalPages = Math.ceil(posts.length / postsPerPage)

  /**
   * Handle page change for pagination
   * @param page - The page number to navigate to
   */
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  /**
   * Fetch posts from the API
   */
  const fetchPosts = useCallback(async () => {
    // Update fetch state to loading
    setFetchState(prev => ({
      ...prev,
      posts: { status: "loading", error: null }
    }))

    try {
      const response = await fetch(API_ENDPOINTS.posts.list)

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`)
      }

      const data = await response.json()

      // Check for possible array or object structure
      let postsArray: PostType[];
      if (Array.isArray(data)) {
        postsArray = data;
      } else if (Array.isArray(data.posts)) {
        postsArray = data.posts;
      } else {
        throw new Error("Malformed posts response")
      }

      // Debug: Log the posts data to see category structure
      console.log("Posts data from API:", postsArray)

      // Debug: Log specifically the category data for each post
      postsArray.forEach(post => {
        console.log(`Post ${post._id} - Category:`, post.category, "Categories:", (post as any).categories)
      })

      // Update posts state
      setPosts(postsArray)

      // Filter featured posts
      const featured = postsArray.filter((post: any) => post.featured === true)
      setFeaturedPosts(featured)

      // Update fetch state to success
      setFetchState(prev => ({
        ...prev,
        posts: { status: "success", error: null }
      }))
    } catch (error) {
      console.error("Error fetching posts:", error)

      // Update fetch state to error
      setFetchState(prev => ({
        ...prev,
        posts: {
          status: "error",
          error: error instanceof Error ? error.message : "Failed to fetch posts"
        }
      }))
    }
  }, [])

  /**
   * Fetch categories from the API
   */
  const fetchCategories = useCallback(async () => {
    // Update fetch state to loading
    setFetchState(prev => ({
      ...prev,
      categories: { status: "loading", error: null }
    }))

    try {
      const response = await fetch(API_ENDPOINTS.categories.list)

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`)
      }

      const data = await response.json()

      // Correction : s'assurer que c'est bien un tableau
      setCategories(Array.isArray(data.categories) ? data.categories : Array.isArray(data) ? data : [])

      // Update fetch state to success
      setFetchState(prev => ({
        ...prev,
        categories: { status: "success", error: null }
      }))
    } catch (error) {
      console.error("Error fetching categories:", error)

      // Update fetch state to error
      setFetchState(prev => ({
        ...prev,
        categories: {
          status: "error",
          error: error instanceof Error ? error.message : "Failed to fetch categories"
        }
      }))
    }
  }, [])

  // Fetch data on component mount
  useEffect(() => {
    fetchPosts()
    fetchCategories()
  }, [fetchPosts, fetchCategories])

  /**
   * Get a random featured post for the hero section
   * @returns A random featured post or null if none available
   */
  const getRandomFeaturedPost = useCallback(() => {
    if (featuredPosts.length === 0) return null
    const randomIndex = Math.floor(Math.random() * featuredPosts.length)
    return featuredPosts[randomIndex]
  }, [featuredPosts])

  /**
   * Render error message for data fetching errors
   */
  const renderErrorMessage = () => {
    const postsError = fetchState.posts.error
    const categoriesError = fetchState.categories.error

    if (!postsError && !categoriesError) return null

    return (
      <div className="my-8 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-medium">Error loading content</h3>
            <p className="text-red-700 text-sm mt-1">
              {postsError || categoriesError}
            </p>
            <button
              onClick={() => {
                if (postsError) fetchPosts()
                if (categoriesError) fetchCategories()
              }}
              className="mt-2 flex items-center text-sm text-red-600 hover:text-red-800"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="pb-16">
      {/* Featured post section */}
      <section className="py-8">
        <Container>
          <AnimateOnView animation="fade">
            <Featured featured={getRandomFeaturedPost()} />
          </AnimateOnView>
        </Container>
      </section>

      {/* Latest articles section */}
      <section className="py-8">
        <Container>
          {/* Section header */}
          <div className="flex items-center justify-between mb-8">
            <AnimateOnView animation="slide-right">
              <H1 className="text-3xl md:text-4xl font-bold">Latest Articles</H1>
            </AnimateOnView>
            <AnimateOnView animation="slide-left">
              <div className="hidden md:block h-1 w-32 bg-gradient-to-r from-primary-300 to-primary-500 rounded-full"></div>
            </AnimateOnView>
          </div>

          {/* Error message */}
          {fetchState.posts.error && renderErrorMessage()}

          {/* Loading state or content */}
          {fetchState.posts.status === "loading" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-lg border bg-card animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg"></div>
                  <div className="p-4">
                    <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                    <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : fetchState.posts.status === "success" && posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts
                .slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage)
                .map((post, index) => (
                  <AnimateOnView key={post._id} animation="slide-up" delay={index * 100}>
                    <PostComponent post={post} />
                  </AnimateOnView>
                ))}
            </div>
          ) : fetchState.posts.status === "success" && posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No posts available at the moment.</p>
            </div>
          ) : null}

          {/* Pagination */}
          {posts.length > postsPerPage && (
            <div className="mt-12 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                showFirstLast={true}
              />
            </div>
          )}
        </Container>
      </section>

      {/* Categories section */}
      <section className="py-8 bg-muted/30">
        <Container>
          <AnimateOnView animation="slide-up">
            <H2 className="text-2xl md:text-3xl font-bold mb-6">Browse by Category</H2>

            {/* Error message */}
            {fetchState.categories.error && renderErrorMessage()}

            {/* Loading state or content */}
            {fetchState.categories.status === "loading" ? (
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-10 w-24 bg-muted rounded-full animate-pulse"></div>
                ))}
              </div>
            ) : fetchState.categories.status === "success" && categories.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <CategoryCard2 key={category._id} category={category} />
                ))}
              </div>
            ) : fetchState.categories.status === "success" && categories.length === 0 ? (
              <p className="text-gray-500">No categories available.</p>
            ) : null}
          </AnimateOnView>
        </Container>
      </section>
    </main>
  )
}

