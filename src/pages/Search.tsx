import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Container } from "../components/ui/container"
import { H1, H3 } from "../components/ui/typography"
import { API_ENDPOINTS } from "../config/api.config"
import { formatDate } from "../lib/utils"
import { getImageUrl } from "../config/api.config"
import SafeImage from "../components/SafeImage"
import { Link } from "react-router-dom"
import { Search as SearchIcon } from "lucide-react"
import AnimateOnView from "../components/AnimateOnView"

interface Post {
  _id: string
  title: string
  summary: string
  cover: string
  createdAt: string
  author: {
    username: string
  }
}

const Search: React.FC = () => {
  const [searchParams] = useSearchParams()
  const query = searchParams.get("q") || ""
  const [posts, setPosts] = useState<Post[]>([])
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
        // Utiliser l'API pour récupérer tous les articles et filtrer côté client
        // Puisque l'endpoint de recherche n'est pas encore implémenté
        const response = await fetch(API_ENDPOINTS.posts.list)

        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.status}`)
        }

        const data = await response.json()
        const allPosts = Array.isArray(data) ? data : data.posts || []

        // Filtrer les articles qui contiennent le terme de recherche dans le titre, le résumé ou le contenu
        const searchTerm = query.toLowerCase()
        const filteredPosts = allPosts.filter(post =>
          post.title?.toLowerCase().includes(searchTerm) ||
          post.summary?.toLowerCase().includes(searchTerm) ||
          post.content?.toLowerCase().includes(searchTerm)
        )

        setPosts(filteredPosts)
      } catch (err) {
        console.error("Search error:", err)
        setError("Failed to fetch search results. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchSearchResults()
  }, [query])

  // Fonction pour mettre en évidence les termes de recherche dans le texte
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>')
  }

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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {query ? "No articles found matching your search." : "Enter a search term to find articles."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <AnimateOnView key={post._id} animation="slide-up" className="h-full">
                <Link
                  to={`/Post/${post._id}`}
                  className="block h-full overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md"
                >
                  <div className="aspect-video w-full overflow-hidden">
                    <SafeImage
                      src={post.cover}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <H3 className="mb-2 line-clamp-2">
                      {query ? (
                        <span dangerouslySetInnerHTML={{
                          __html: highlightSearchTerm(post.title, query)
                        }} />
                      ) : post.title}
                    </H3>
                    <p className="text-muted-foreground mb-2 line-clamp-3">
                      {query ? (
                        <span dangerouslySetInnerHTML={{
                          __html: highlightSearchTerm(post.summary, query)
                        }} />
                      ) : post.summary}
                    </p>

                    {/* Afficher où le terme de recherche a été trouvé */}
                    {query && (
                      <div className="mb-3 text-xs">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                          <SearchIcon className="mr-1 h-3 w-3" />
                          {post.title?.toLowerCase().includes(query.toLowerCase()) ? 'Found in title' :
                           post.summary?.toLowerCase().includes(query.toLowerCase()) ? 'Found in summary' :
                           'Found in content'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{post.author?.username || "Unknown author"}</span>
                      <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                    </div>
                  </div>
                </Link>
              </AnimateOnView>
            ))}
          </div>
        )}
      </Container>
    </main>
  )
}

export default Search