"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import Post from "../components/Post"
import { CategoryCard2 } from "../components/category"
import AnimateOnView from "../components/AnimateOnView"
import Pagination from "../components/pagination"
import { Container } from "../components/ui/container"
import { H1, H2 } from "../components/ui/typography"
import { Button } from "../components/ui/button"
import { CategoryProps } from "../types/CategoryProps"
import { FetchStatus} from "../types/FetchStatus"
import { Post as PostType } from "../types/PostType"
import { API_ENDPOINTS } from "../config/api.config"
import { ArrowLeft, Home, AlertCircle, RefreshCw, Tag, FileText } from "lucide-react"


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
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Container>
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Loading category...</p>
            </div>
          </div>
        </Container>
      </main>
    )
  }

  // Show error state
  if (error && !category) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Container>
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-lg max-w-md text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-500" />
              <h3 className="font-semibold mb-2">Error Loading Category</h3>
              <p className="text-sm">{error}</p>
            </div>
            <Button
              onClick={() => {
                fetchCategory()
                fetchPosts()
              }}
              className="mt-6"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Container>
      </main>
    )
  }

  // If category not found
  if (!category) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Container>
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                <Tag className="w-12 h-12 text-muted-foreground" />
              </div>
              <H1 className="text-2xl font-bold text-foreground mb-4">Category Not Found</H1>
              <p className="text-muted-foreground mb-6 max-w-md">
                The category you're looking for doesn't exist or has been removed.
              </p>
              <Link to="/">
                <Button>
                  <Home className="w-4 h-4 mr-2" />
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 lg:py-20">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        
        <Container className="relative">
          {/* Breadcrumb */}
          <AnimateOnView animation="fade" delay={100}>
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol className="flex items-center gap-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/"
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </Link>
                </li>
                <li className="text-muted-foreground/50">/</li>
                <li>
                  <span className="text-foreground font-medium">Categories</span>
                </li>
                <li className="text-muted-foreground/50">/</li>
                <li>
                  <span className="text-primary font-medium">{category.name}</span>
                </li>
              </ol>
            </nav>
          </AnimateOnView>

          {/* Category Header */}
          <div className="text-center mb-12 lg:mb-16">
            <AnimateOnView animation="fade" delay={200}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                <Tag className="w-4 h-4" />
                Category
              </div>
            </AnimateOnView>
            
            <AnimateOnView animation="slide-up" delay={300}>
              <H1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6">
                {category.name}
              </H1>
            </AnimateOnView>
            
            {category.description && (
              <AnimateOnView animation="slide-up" delay={400}>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  {category.description}
                </p>
              </AnimateOnView>
            )}

            <AnimateOnView animation="slide-up" delay={500}>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{filteredPosts.length} {filteredPosts.length === 1 ? 'Article' : 'Articles'}</span>
                </div>
              </div>
            </AnimateOnView>
          </div>
        </Container>
      </section>

      {/* Posts Section */}
      <section className="py-16 lg:py-24">
        <Container>
          {/* Section Header */}
          <div className="text-center mb-12">
            <AnimateOnView animation="slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-4">
                <FileText className="w-4 h-4" />
                Articles in {category.name}
              </div>
              <H2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Latest <span className="text-primary">Posts</span>
              </H2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Discover all articles related to {category.name.toLowerCase()}.
              </p>
            </AnimateOnView>
          </div>

          {/* Error message */}
          {error && (
            <AnimateOnView animation="fade">
              <div className="my-8 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-red-800 dark:text-red-200 font-medium">Error loading posts</h3>
                    <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
                    <button
                      onClick={fetchPosts}
                      className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            </AnimateOnView>
          )}

          {/* Loading state */}
          {status.posts === "loading" && filteredPosts.length === 0 ? (
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
          ) : status.posts === "success" && filteredPosts.length === 0 ? (
            <AnimateOnView animation="fade">
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                  <FileText className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Posts Found</h3>
                <p className="text-muted-foreground mb-6">There are no posts in this category yet.</p>
                <Link to="/">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Browse All Posts
                  </Button>
                </Link>
              </div>
            </AnimateOnView>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentPosts.map((post, index) => (
                <AnimateOnView key={post._id} animation="slide-up" delay={index * 100}>
                  <div className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <Post post={post} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]" showActions={true} />
                    </div>
                  </div>
                </AnimateOnView>
              ))}
            </div>
          )}

          {/* Pagination */}
          {filteredPosts.length > postsPerPage && (
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

      {/* Other Categories Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-muted/50 via-muted/30 to-background">
        <Container>
          <div className="text-center mb-12">
            <AnimateOnView animation="slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium mb-4">
                <Tag className="w-4 h-4" />
                Explore More
              </div>
              <H2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Other <span className="text-primary">Categories</span>
              </H2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Discover more topics and find articles that interest you.
              </p>
            </AnimateOnView>
          </div>

          <AnimateOnView animation="slide-up" delay={200}>
            {status.categories === "loading" && categories.length === 0 ? (
              <div className="flex flex-wrap justify-center gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-12 w-32 bg-muted rounded-full animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-4">
                {categories
                  .filter(cat => cat._id !== category._id) // Exclude current category
                  .map((cat, index) => (
                    <AnimateOnView key={cat._id} animation="slide-up" delay={index * 50}>
                      <div className="group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-emerald-500/30 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                          <CategoryCard2 category={cat} />
                        </div>
                      </div>
                    </AnimateOnView>
                  ))}
              </div>
            )}
          </AnimateOnView>
        </Container>
      </section>
    </main>
  )
}

export default CategoryPage