"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Link } from "react-router-dom"
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
import { useGlobalStateEvents } from '../services/globalStateManager'
import { showError, showSuccess } from '../lib/toast-helpers'

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
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch posts"
      showError(errorMessage, "Erreur de chargement")

      // Update fetch state to error
      setFetchState(prev => ({
        ...prev,
        posts: {
          status: "error",
          error: errorMessage
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
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch categories"
      showError(errorMessage, "Erreur de chargement")

      // Update fetch state to error
      setFetchState(prev => ({
        ...prev,
        categories: {
          status: "error",
          error: errorMessage
        }
      }))
    }
  }, [])

  // Fetch data on component mount
  useEffect(() => {
    fetchPosts()
    fetchCategories()
  }, [fetchPosts, fetchCategories])

  // Subscribe to global state changes for real-time updates
  useGlobalStateEvents([
    {
      type: 'POST_UPDATED',
      handler: useCallback(({ postId, postData }) => {
        console.log('[Home] Received post update:', { postId, hasData: !!postData })
        showSuccess('Article mis à jour avec succès')
        
        // Update post in main list
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post._id === postId ? { ...post, ...postData } : post
          )
        )
        
        // Update in featured posts if present
        setFeaturedPosts(prevFeatured => 
          prevFeatured.map(post => 
            post._id === postId ? { ...post, ...postData } : post
          )
        )
        
        // Update in recent posts if present
        setRecentPosts(prevRecent => 
          prevRecent.map(post => 
            post._id === postId ? { ...post, ...postData } : post
          )
        )
      }, [])
    },
    {
      type: 'POST_DELETED',
      handler: useCallback(({ postId }) => {
        console.log('[Home] Received post deletion:', { postId })
        showSuccess('Article supprimé avec succès')
        
        // Remove from main posts list
        setPosts(prevPosts => prevPosts.filter(post => post._id !== postId))
        
        // Remove from featured posts
        setFeaturedPosts(prevFeatured => prevFeatured.filter(post => post._id !== postId))
        
        // Remove from recent posts
        setRecentPosts(prevRecent => prevRecent.filter(post => post._id !== postId))
      }, [])
    },
    {
      type: 'POST_CREATED',
      handler: useCallback(({ postData }) => {
        console.log('[Home] Received post creation:', { postData })
        showSuccess('Nouvel article créé avec succès')
        
        // Add to main posts list at the beginning
        setPosts(prevPosts => [postData, ...prevPosts])
        
        // If it's featured, add to featured posts
        if (postData.featured) {
          setFeaturedPosts(prevFeatured => [postData, ...prevFeatured])
        }
        
        // Check if it qualifies for recent posts
        const postDate = new Date(postData.createdAt)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        if (postDate >= thirtyDaysAgo) {
          setRecentPosts(prevRecent => [postData, ...prevRecent]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          )
        }
      }, [])
    },
    {
      type: 'CACHE_INVALIDATE',
      handler: useCallback(({ scope, reason }) => {
        console.log('[Home] Received cache invalidation:', { scope, reason })
        
        if (scope === 'home-posts' || scope === 'all') {
          // Force refresh of all posts data immediately
          console.log('[Home] Force refreshing posts due to cache invalidation')
          
          // Force immediate refresh
          fetchPosts()
          
          // Also refresh categories if needed
          if (reason === 'post-created' || reason === 'post-updated') {
            fetchCategories()
          }
        }
      }, [fetchPosts, fetchCategories])
    }
  ], [fetchPosts, fetchCategories])

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

  /**
   * Render posts content based on current state
   */
  const renderPostsContent = () => {
    if (fetchState.posts.status === "loading") {
      return (
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
      )
    }

    if (fetchState.posts.status === "success" && posts.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts
            .slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage)
            .map((post, index) => (
              <AnimateOnView key={post._id} animation="slide-up" delay={index * 100}>
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-emerald-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <PostComponent 
                      post={post} 
                      className="border-0 shadow-md hover:shadow-lg transition-all duration-300" 
                      showActions={true} 
                    />
                  </div>
                </div>
              </AnimateOnView>
            ))}
        </div>
      )
    }

    if (fetchState.posts.status === "success" && posts.length === 0) {
      return (
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
      )
    }

    return null
  }

  /**
   * Render categories content based on current state
   */
  const renderCategoriesContent = () => {
    if (fetchState.categories.status === "loading") {
      return (
        <div className="flex flex-wrap justify-center gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-12 w-32 bg-muted rounded-full animate-pulse"></div>
          ))}
        </div>
      )
    }

    if (fetchState.categories.status === "success" && categories.length > 0) {
      return (
        <div className="flex flex-wrap justify-center gap-4">
          {categories.map((category, index) => (
            <AnimateOnView key={category._id} animation="slide-up" delay={index * 50}>
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/8 to-emerald-500/8 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <CategoryCard2 category={category} />
                </div>
              </div>
            </AnimateOnView>
          ))}
        </div>
      )
    }

    if (fetchState.categories.status === "success" && categories.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No categories available</h3>
          <p className="text-muted-foreground">Categories will appear here once they're created.</p>
        </div>
      )
    }

    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section with Latest Article */}
      <section className="relative overflow-hidden py-12 lg:py-20">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-primary/3"></div>
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        
        <Container className="relative">
          {/* Hero header */}
          <div className="text-center mb-12 lg:mb-16">
            <AnimateOnView animation="fade" delay={100}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6 glass-effect">
                <div className="w-2 h-2 bg-primary rounded-full pulse-glow"></div>
                Latest from our blog
              </div>
            </AnimateOnView>
            <AnimateOnView animation="slide-up" delay={200}>
              <H1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 gradient-text">
                Discover Amazing
                <br />
                <span className="text-primary float-animation">Stories</span>
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
              <LatestArticle post={getRandomRecentPost()} />
            </div>
          </AnimateOnView>
        </Container>
      </section>

      {/* Enhanced Featured Posts Section */}
      {featuredPosts.length > 0 && (
        <section className="py-20 lg:py-28 relative overflow-hidden">
          {/* Minimal background decorations */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/98 to-background/95"></div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary/3 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-emerald-500/3 to-transparent rounded-full blur-3xl"></div>
          
          <Container className="relative">
            {/* Enhanced section header */}
            <div className="text-center mb-16">
              <AnimateOnView animation="slide-up">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-background/30 text-primary/80 dark:text-primary/70 rounded-full text-sm font-semibold mb-6 border border-border/30 backdrop-blur-sm">
                  <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>Editor's Choice</span>
                  <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full animate-pulse"></div>
                </div>
                <H2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                  Featured <span className="text-primary">Stories</span>
                </H2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Handpicked premium content showcasing the best of our community's creativity, expertise, and unique perspectives.
                </p>
              </AnimateOnView>
            </div>
            
            {/* Enhanced featured posts layout */}
            {featuredPosts.length === 1 ? (
              /* Single featured post - hero layout */
              <AnimateOnView animation="fade" delay={200}>
                <div className="max-w-4xl mx-auto">
                  <div className="group relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/5 via-primary/3 to-emerald-500/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="relative bg-background/30 backdrop-blur-sm border border-border/30 rounded-3xl p-8 lg:p-12 hover:border-primary/30 transition-all duration-500">
                      <PostComponent 
                        post={featuredPosts[0]} 
                        isFavorite={true}
                        showActions={true} 
                        showStats={true}
                        className="border-0 shadow-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              </AnimateOnView>
            ) : (
              /* Multiple featured posts - enhanced grid */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
                {featuredPosts.slice(0, 2).map((post, index) => (
                  <AnimateOnView key={post._id} animation="slide-up" delay={200 + index * 150}>
                    <div className="group relative h-full">
                      {/* Gradient border effect */}
                      <div className="absolute -inset-2 bg-gradient-to-r from-primary/8 via-primary/5 to-emerald-500/8 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Card content */}
                      <div className="relative h-full bg-background/30 backdrop-blur-sm border border-border/30 rounded-3xl p-6 lg:p-8 hover:border-primary/30 transition-all duration-500">
                        {/* Featured badge */}
                        <div className="absolute -top-3 -right-3 z-10">
                          <div className="bg-gradient-to-r from-primary to-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-md rotate-12 group-hover:rotate-0 transition-transform duration-300">
                            <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Featured
                          </div>
                        </div>
                        
                        <PostComponent 
                          post={post} 
                          isFavorite={true}
                          showActions={true} 
                          showStats={true}
                          className="border-0 shadow-none bg-transparent"
                          fixedHeight={false}
                        />
                      </div>
                    </div>
                  </AnimateOnView>
                ))}
              </div>
            )}
            
            {/* View all featured posts link */}
            {featuredPosts.length > 2 && (
              <AnimateOnView animation="fade" delay={600}>
                <div className="text-center mt-12">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="bg-background/30 backdrop-blur-sm border-border/30 hover:border-primary/30 text-foreground hover:text-primary font-semibold px-8 py-3 rounded-full transition-all duration-300"
                  >
                    <span>View All Featured Posts ({featuredPosts.length})</span>
                    <svg className="w-4 h-4 ml-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                </div>
              </AnimateOnView>
            )}
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
          {renderPostsContent()}

          {/* Pagination */}
          {posts.length > postsPerPage && (
            <AnimateOnView animation="fade" delay={300}>
              <div className="mt-16 flex justify-center">
                <div className="bg-background/30 backdrop-blur-sm border border-border/30 rounded-2xl p-2">
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
      <section className="py-16 lg:py-24 bg-gradient-to-br from-background/98 via-background/95 to-background">
        <Container>
          <div className="text-center mb-12">
            <AnimateOnView animation="slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-background/30 text-primary/70 dark:text-primary/60 rounded-full text-sm font-medium mb-4 border border-border/30">
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
            {renderCategoriesContent()}
          </AnimateOnView>
        </Container>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 lg:py-24">
        <Container>
          <AnimateOnView animation="fade">
            <div className="relative overflow-hidden rounded-3xl bg-background/30 border border-border/30 p-12 lg:p-16 text-center backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/3 to-emerald-500/5"></div>
              <div className="relative">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
                  Ready to Share Your Story?
                </h2>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Join our community of writers and share your unique perspective with the world.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/coming-soon">
                    <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Start Writing
                    </Button>
                  </Link>
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