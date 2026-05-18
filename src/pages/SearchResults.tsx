import { Link } from "react-router-dom"
import { Search as SearchIcon } from "lucide-react"
import AnimateOnView from "../components/AnimateOnView"
import SafeImage from "../components/SafeImage"
import { H3 } from "../components/ui/typography"
import { formatDate } from "../lib/utils"
import { sanitizeHtml } from "../lib/sanitizeHtml"

export interface SearchPost {
  _id: string
  title: string
  summary: string
  content?: string
  cover?: string
  coverImage?: string | { url: string; alt?: string }
  createdAt: string
  author: {
    username: string
  }
}

interface SearchResultsProps {
  posts: SearchPost[]
  query: string
  loading: boolean
  error: string | null
}

const getCoverImageUrl = (post: SearchPost): string => {
  if (typeof post.coverImage === 'string') {
    return post.coverImage
  }

  return post.coverImage?.url || post.cover || '/placeholder.svg'
}

const highlightSearchTerm = (text: string, searchTerm: string) => {
  if (!searchTerm || !text) return text

  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
  const regex = new RegExp(`(${escapedTerm})`, 'gi')
  return sanitizeHtml(text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>'))
}

const getMatchLocation = (post: SearchPost, query: string) => {
  const searchTerm = query.toLowerCase()

  if (post.title?.toLowerCase().includes(searchTerm)) return 'Found in title'
  if (post.summary?.toLowerCase().includes(searchTerm)) return 'Found in summary'
  return 'Found in content'
}

const HighlightedText = ({ text, query }: { text: string; query: string }) => {
  if (!query) return <>{text}</>

  return (
    <span
      dangerouslySetInnerHTML={{
        __html: highlightSearchTerm(text, query)
      }}
    />
  )
}

const SearchLoadingState = () => (
  <div className="flex justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
)

const SearchErrorState = ({ error }: { error: string }) => (
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
    <p className="text-red-700 dark:text-red-400">{error}</p>
  </div>
)

const SearchEmptyState = ({ query }: { query: string }) => (
  <div className="text-center py-12">
    <p className="text-muted-foreground text-lg">
      {query ? "No articles found matching your search." : "Enter a search term to find articles."}
    </p>
  </div>
)

const MatchBadge = ({ post, query }: { post: SearchPost; query: string }) => {
  if (!query) return null

  return (
    <div className="mb-3 text-xs">
      <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
        <SearchIcon className="mr-1 h-3 w-3" />
        {getMatchLocation(post, query)}
      </span>
    </div>
  )
}

const SearchResultCard = ({ post, query }: { post: SearchPost; query: string }) => (
  <AnimateOnView key={post._id} animation="slide-up" className="h-full">
    <Link
      to={`/Post/${post._id}`}
      className="block h-full overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md"
    >
      <div className="aspect-video w-full overflow-hidden">
        <SafeImage
          src={getCoverImageUrl(post)}
          alt={post.title}
          className="h-full w-full object-cover transition-transform hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <H3 className="mb-2 line-clamp-2">
          <HighlightedText text={post.title} query={query} />
        </H3>
        <p className="text-muted-foreground mb-2 line-clamp-3">
          <HighlightedText text={post.summary} query={query} />
        </p>
        <MatchBadge post={post} query={query} />
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{post.author?.username || "Unknown author"}</span>
          <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
        </div>
      </div>
    </Link>
  </AnimateOnView>
)

const SearchResultsGrid = ({ posts, query }: { posts: SearchPost[]; query: string }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {posts.map((post) => (
      <SearchResultCard key={post._id} post={post} query={query} />
    ))}
  </div>
)

const SearchResults = ({ posts, query, loading, error }: SearchResultsProps) => {
  if (loading) return <SearchLoadingState />
  if (error) return <SearchErrorState error={error} />
  if (posts.length === 0) return <SearchEmptyState query={query} />

  return <SearchResultsGrid posts={posts} query={query} />
}

export default SearchResults
