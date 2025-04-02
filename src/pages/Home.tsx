"use client"

import { useEffect, useState } from "react"
import Featured from "../components/Featured"
import Post from "../components/Post"
import { CategoryCard2 } from "../components/category"
import AnimateOnView from "../components/AnimateOnView"
import Pagination from "../components/pagination"
import { Container } from "../components/ui/container"
import { H1, H2 } from "../components/ui/typography"
import React from "react"

export default function Home() {
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 6
  const [posts, setPosts] = useState([])
  const totalPages = Math.ceil(posts.length / postsPerPage)
  const [categories, setCategories] = useState([])
  const [featuredPosts, setFeaturedPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const postsResponse = await fetch("https://mern-backend-neon.vercel.app/posts")
        const postsData = await postsResponse.json()
        setPosts(postsData)
        setFeaturedPosts(postsData.filter((post) => post.featured === true))

        const categoriesResponse = await fetch("https://mern-backend-neon.vercel.app/categories")
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const getRandomFeaturedPost = () => {
    if (featuredPosts.length === 0) return null
    const randomIndex = Math.floor(Math.random() * featuredPosts.length)
    return featuredPosts[randomIndex]
  }

  return (
    <main className="pb-16">
      <section className="py-8">
        <Container>
          <AnimateOnView animation="fade">
            <Featured featured={getRandomFeaturedPost()} />
          </AnimateOnView>
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <AnimateOnView animation="slide-right">
              <H1 className="text-3xl md:text-4xl font-bold">Latest Articles</H1>
            </AnimateOnView>
            <AnimateOnView animation="slide-left">
              <div className="hidden md:block h-1 w-32 bg-gradient-to-r from-primary-300 to-primary-500 rounded-full"></div>
            </AnimateOnView>
          </div>

          {isLoading ? (
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage).map((post, index) => (
                <AnimateOnView key={post._id} animation="slide-up" delay={index * 100}>
                  <Post post={post} />
                </AnimateOnView>
              ))}
            </div>
          )}

          <div className="mt-12 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              showFirstLast={true}
            />
          </div>
        </Container>
      </section>

      <section className="py-8 bg-muted/30">
        <Container>
          <AnimateOnView animation="slide-up">
            <H2 className="text-2xl md:text-3xl font-bold mb-6">Browse by Category</H2>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <CategoryCard2 key={category._id} category={category} />
              ))}
            </div>
          </AnimateOnView>
        </Container>
      </section>
    </main>
  )
}

