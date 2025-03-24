import React from "react"
import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import type { PostType } from "./Post"
import AnimateOnView from "./AnimateOnView"
import { formatDate, getImageUrl, getOptimizedImageUrl } from "../lib/utils"
import { CalendarIcon, User2 } from "lucide-react"
import { Badge } from "./ui/badge"

interface FeaturedProps {
  featured: PostType | null
}

const Featured: React.FC<FeaturedProps> = ({ featured }) => {
  if (!featured) return null

  const { _id, title, summary, cover, author, createdAt } = featured

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900">
      <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>
      <div className="relative flex flex-col md:flex-row md:items-center p-6 md:p-10 gap-8">
        <AnimateOnView animation="slide-right" className="md:w-1/2" delay={100}>
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary-300 to-primary-500 opacity-70 blur-sm"></div>
            <img
              src={getOptimizedImageUrl(getImageUrl(cover)) || "/placeholder.svg"}
              alt={title}
              className="relative w-full md:h-[350px] object-cover rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
            />
          </div>
        </AnimateOnView>
        <div className="mt-4 md:mt-0 md:w-1/2">
          <AnimateOnView animation="fade" delay={200}>
            <Badge
              variant="outline"
              className="mb-3 bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:border-primary-800"
            >
              Featured Post
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">{title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              <time dateTime={new Date(createdAt).toISOString()}>
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                {formatDate(createdAt)}
              </time>
              <span className="inline-flex items-center">
                <User2 className="h-4 w-4 inline mr-1" />
                {author.username}
              </span>
            </div>
            <p className="text-muted-foreground mb-6">{summary}</p>
            <AnimateOnView animation="slide-up" delay={300}>
              <Link to={`/Post/${_id}`}>
                <Button>
                  Read Full Article
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
              </Link>
            </AnimateOnView>
          </AnimateOnView>
        </div>
      </div>
    </div>
  )
}

export default Featured

