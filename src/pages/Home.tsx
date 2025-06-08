"use client"

import React, { useEffect, useState, useCallback } from "react"
import Featured from "../components/Featured"
import LatestArticle from "../components/LatestArticle"
import PostComponent from "../components/Post"
import { CategoryCard2 } from "../components/category"
import AnimateOnView from "../components/AnimateOnView"
import Pagination from "../components/pagination"
import { Container } from "../components/ui/container"
import { H1, H2 } from "../components/ui/typography"
import { Button } from "../components/ui/button"
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
  const [recentPosts, setRecentPosts] = useState<PostType[]>([])

  // UI state
  const [fetchState, setFetchState] = useState<FetchState>({
    posts: { status: "idle", error: null },
    categories: { status: "idle", error: null }
  })

  // Derived state
  const totalPages = Math.ceil(posts.length / postsPerPage)

  /**
   * Filter posts from the last 30 days
   * @param posts - Array of posts to filter
   * @returns Array of posts from the last 30 days
   */
  const filterRecentPosts = useCallback((posts: PostType[]) => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    return posts.filter(post => {
      const postDate = new Date(post.createdAt)
      return postDate >= thirtyDaysAgo
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [])

  /**
   * Get a random recent post for the latest article section
   * @returns A random recent post or null if none available
   */
  const getRandomRecentPost = useCallback(() => {
    if (recentPosts.length === 0) return null
    const randomIndex = Math.floor(Math.random() * recentPosts.length)
    return recentPosts[randomIndex]
  }, [recentPosts])

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

      // Filter recent posts (last 30 days) for Latest Articles section
      const recent = filterRecentPosts(postsArray)
      setRecentPosts(recent)

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
      <div className="my-8 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 dark:text-red-200 font-medium">Error loading content</h3>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">
              {postsError || categoriesError}
            </p>
            <button
              onClick={() => {
                if (postsError) fetchPosts()
                if (categoriesError) fetchCategories()
              }}
              className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
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
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section with Latest Article */}
      <section className="relative overflow-hidden py-12 lg:py-20">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        
        <Container className="relative">
          {/* Hero header */}
          <div className="text-center mb-12 lg:mb-16">
            <AnimateOnView animation="fade" delay={100}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                Latest from our blog
              </div>
            </AnimateOnView>
            <AnimateOnView animation="slide-up" delay={200}>
              <H1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
                Discover Amazing
                <br />
                <span className="text-primary">Stories</span>
              </H1>
            </AnimateOnView>
            <AnimateOnView animation="slide-up" delay={300}>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Explore our collection of thoughtfully crafted articles, insights, and stories from passionate writers around the world.
              </p>
            </AnimateOnView>
          </div>
          
          {/* Latest Article Showcase */}
          <AnimateOnView animation="fade" delay={400}>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-emerald-500/20 to-primary/20 rounded-2xl blur-xl opacity-50"></div>
              <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-1">
                <LatestArticle post={getRandomRecentPost()} />
              </div>
            </div>
          </AnimateOnView>
        </Container>
      </section>

      {/* Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <section className="py-16 lg:py-24 bg-muted/30">
          <Container>
            <div className="text-center mb-12">
              <AnimateOnView animation="slide-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-sm font-medium mb-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Featured Content
                </div>
                <H2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                  Editor's <span className="text-primary">Picks</span>
                </H2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Handpicked articles that showcase the best of our community's creativity and expertise.
                </p>
              </AnimateOnView>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredPosts.slice(0, 2).map((post, index) => (
                <AnimateOnView key={post._id} animation="slide-up" delay={index * 200}>
                  <div className="group relative">
                    <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative">
                      <PostComponent post={post} variant="featured" />
                    </div>
                  </div>
                </AnimateOnView>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* All Posts Section */}
      <section className="py-16 lg:py-24">
        <Container>
          {/* Section header */}
          <div className="text-center mb-12">
            <AnimateOnView animation="slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                All Articles
              </div>
              <H2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Browse All <span className="text-primary">Posts</span>
              </H2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Dive into our complete collection of articles covering various topics and interests.
              </p>
            </AnimateOnView>
          </div>

          {/* Error message */}
          {fetchState.posts.error && (
            <AnimateOnView animation="fade">
              {renderErrorMessage()}
            </AnimateOnView>
          )}

          {/* Loading state or content */}
          {fetchState.posts.status === "loading" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="group">
                  <div className="rounded-2xl border bg-card animate-pulse overflow-hidden">
                    <div className="h-56 bg-muted"></div>
                    <div className="p-6">
                      <div className="h-4 bg-muted rounded w-1/4 mb-3"></div>
                      <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-muted rounded w-full mb-2"></div>
                      <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : fetchState.posts.status === "success" && posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts
                .slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage)
                .map((post, index) => (
                  <AnimateOnView key={post._id} animation="slide-up" delay={index * 100}>
                    <div className="group relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <PostComponent post={post} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]" />
                      </div>
                    </div>
                  </AnimateOnView>
                ))}
            </div>
          ) : fetchState.posts.status === "success" && posts.length === 0 ? (
            <AnimateOnView animation="fade">
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No posts available</h3>
                <p className="text-muted-foreground">Check back later for new content!</p>
              </div>
            </AnimateOnView>
          ) : null}

          {/* Pagination */}
          {posts.length > postsPerPage && (
            <AnimateOnView animation="fade" delay={300}>
              <div className="mt-16 flex justify-center">
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-2">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    showFirstLast={true}
                  />
                </div>
              </div>
            </AnimateOnView>
          )}
        </Container>
      </section>

      {/* Categories section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-muted/50 via-muted/30 to-background">
        <Container>
          <div className="text-center mb-12">
            <AnimateOnView animation="slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Categories
              </div>
              <H2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Explore by <span className="text-primary">Topic</span>
              </H2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Find articles that match your interests by browsing our organized categories.
              </p>
            </AnimateOnView>
          </div>

          {/* Error message */}
          {fetchState.categories.error && (
            <AnimateOnView animation="fade">
              {renderErrorMessage()}
            </AnimateOnView>
          )}

          {/* Loading state or content */}
          <AnimateOnView animation="slide-up" delay={200}>
            {fetchState.categories.status === "loading" ? (
              <div className="flex flex-wrap justify-center gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-12 w-32 bg-muted rounded-full animate-pulse"></div>
                ))}
              </div>
            ) : fetchState.categories.status === "success" && categories.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-4">
                {categories.map((category, index) => (
                  <AnimateOnView key={category._id} animation="slide-up" delay={index * 50}>
                    <div className="group relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-emerald-500/30 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative">
                        <CategoryCard2 category={category} />
                      </div>
                    </div>
                  </AnimateOnView>
                ))}
              </div>
            ) : fetchState.categories.status === "success" && categories.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No categories available</h3>
                <p className="text-muted-foreground">Categories will appear here once they're created.</p>
              </div>
            ) : null}
          </AnimateOnView>
        </Container>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 lg:py-24">
        <Container>
          <AnimateOnView animation="fade">
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-12 lg:p-16 text-center">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-emerald-500/10"></div>
              <div className="relative">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                  Ready to Share Your Story?
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join our community of writers and share your unique perspective with the world.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Start Writing
                  </Button>
                  <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted">
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </AnimateOnView>
        </Container>
      </section>
    </main>
  )
}