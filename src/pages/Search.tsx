import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Container } from "../components/ui/container"
import { H1 } from "../components/ui/typography"
import { API_ENDPOINTS } from "../config/api.config"
import { Search as SearchIcon } from "lucide-react"
import AnimateOnView from "../components/AnimateOnView"
import SearchResults, { SearchPost } from "./SearchResults"

const buildSearchUrl = (searchTerm: string): string => {
  const params = new URLSearchParams({
    search: searchTerm,
    limit: '30',
  })

  return `${API_ENDPOINTS.posts.list}?${params.toString()}`
}

const extractPostsFromResponse = (data: unknown): SearchPost[] => {
  if (Array.isArray(data)) return data

  if (data && typeof data === 'object') {
    const responseData = data as {
      posts?: SearchPost[]
      data?: { posts?: SearchPost[] }
    }

    return responseData.data?.posts || responseData.posts || []
  }

  return []
}

const Search: React.FC = () => {
  const [searchParams] = useSearchParams()
  const query = searchParams.get("q") || ""
  const [posts, setPosts] = useState<SearchPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setPosts([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(buildSearchUrl(query), {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.status}`)
        }

        const data = await response.json()
        setPosts(extractPostsFromResponse(data))
      } catch (err) {
        console.error("Search error:", err)
        setError("Failed to fetch search results. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [query])

  return (
    <main className="py-10">
      <Container>
        <AnimateOnView animation="fade">
          <div className="mb-8 text-center">
            <H1>Search Results</H1>
            <div className="flex items-center justify-center mt-4 text-muted-foreground">
              <SearchIcon className="mr-2 h-5 w-5" />
              <p className="text-lg">
                {query ? `Results for "${query}"` : "Enter a search term to find articles"}
              </p>
            </div>
          </div>
        </AnimateOnView>

        <SearchResults posts={posts} query={query} loading={loading} error={error} />
      </Container>
    </main>
  )
}

export default Search
