import React from "react"
import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import type { Post as PostType } from "../types/PostType"
import AnimateOnView from "./AnimateOnView"
import { formatDate, getOptimizedImageUrl } from "../lib/utils"
import { getImageUrl } from "../config/api.config"
import SafeImage from "./SafeImage"
import { CalendarIcon, User2, Clock } from "lucide-react"
import { Badge } from "./ui/badge"

interface LatestArticleProps {
  post: PostType | null
}

const LatestArticle: React.FC<LatestArticleProps> = ({ post }) => {
  if (!post) return null

  const { _id, title, summary, cover, author, createdAt } = post

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900">
      <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10"></div>
      <div className="relative flex flex-col md:flex-row md:items-center p-6 md:p-10 gap-8">
        <AnimateOnView animation="slide-right" className="md:w-1/2" delay={100}>
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-green-300 to-emerald-500 opacity-70 blur-sm"></div>
            <SafeImage
              src={cover}
              alt={title}
              className="relative w-full md:h-[350px] object-cover rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              height={350}
              loading="eager"
            />
          </div>
        </AnimateOnView>
        <div className="mt-4 md:mt-0 md:w-1/2">
          <AnimateOnView animation="fade" delay={200}>
            <Badge
              variant="outline"
              className="mb-3 bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800"
            >
              <Clock className="h-3 w-3 mr-1" />
              Latest Article
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
                <Button className="bg-green-600 hover:bg-green-700">
                  Read Latest Article
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

export default LatestArticle