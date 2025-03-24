import { Link } from "react-router-dom"
import { formatISO9075 } from "date-fns"
import { htmlToText } from "html-to-text"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { formatDate, getImageUrl, getOptimizedImageUrl } from "../lib/utils"
import { CalendarIcon, User2 } from "lucide-react"
import React from "react"

type PostType = {
  _id: string
  title: string
  summary: string
  cover: string
  author: { username: string }
  createdAt: string | Date
  content: string
  category: {
    _id: string
    name: string
    description?: string
  }
}

export interface PostProps {
  post: PostType
  variant?: "default" | "featured" | "compact"
}

export default function Post({ post, variant = "default" }: PostProps) {
  const { _id, title, summary, cover, author, createdAt, category } = post

  // Convert HTML content to plain text
  const plainTextContent = htmlToText(post.content, {
    wordwrap: 130,
    limits: { maxInputLength: 500 },
  })

  if (variant === "compact") {
    return (
      <Card className="overflow-hidden h-full flex flex-col">
        <Link to={`/Post/${_id}`} className="relative block aspect-[16/9] overflow-hidden">
          <img
            alt={title}
            src={getOptimizedImageUrl(getImageUrl(cover)) || "/placeholder.svg"}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        </Link>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <time dateTime={formatISO9075(new Date(createdAt))}>
              <CalendarIcon className="h-3 w-3 inline mr-1" />
              {formatDate(createdAt)}
            </time>
            <span className="inline-flex items-center">
              <User2 className="h-3 w-3 inline mr-1" />
              {author.username}
            </span>
          </div>
          <CardTitle className="text-lg">
            <Link
              to={`/Post/${_id}`}
              className="hover:text-primary transition-colors"
              aria-label={`Read full post: ${title}`}
            >
              {title}
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex-grow">
          <p className="line-clamp-2 text-sm text-muted-foreground">{summary}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Link to={`/category/${category._id}`}>
            <Badge variant="outline" className="hover:bg-primary-50 hover:text-primary-700 transition-colors">
              {category.name}
            </Badge>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  if (variant === "featured") {
    return (
      <Card className="overflow-hidden border-0 shadow-none bg-transparent">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <Link to={`/Post/${_id}`} className="relative block overflow-hidden rounded-xl">
            <img
              alt={title}
              src={getOptimizedImageUrl(getImageUrl(cover)) || "/placeholder.svg"}
              className="h-full w-full object-cover aspect-[16/10] transition-transform duration-300 hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          </Link>
          <div className="flex flex-col">
            <Badge variant="outline" className="self-start mb-3 bg-primary-50 text-primary-700 border-primary-200">
              Featured
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              <Link
                to={`/Post/${_id}`}
                className="hover:text-primary transition-colors"
                aria-label={`Read full post: ${title}`}
              >
                {title}
              </Link>
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
              <time dateTime={formatISO9075(new Date(createdAt))}>
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                {formatDate(createdAt)}
              </time>
              <span className="inline-flex items-center">
                <User2 className="h-4 w-4 inline mr-1" />
                {author.username}
              </span>
            </div>
            <p className="text-muted-foreground mb-4">{summary}</p>
            <Link to={`/Post/${_id}`} className="text-primary font-medium hover:underline self-start">
              Read more →
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  // Default variant
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <Link to={`/Post/${_id}`} className="relative block overflow-hidden">
        <img
          alt={title}
          src={getOptimizedImageUrl(getImageUrl(cover)) || "/placeholder.svg"}
          className="h-56 w-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
          decoding="async"
        />
      </Link>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <time dateTime={formatISO9075(new Date(createdAt))}>
            <CalendarIcon className="h-3 w-3 inline mr-1" />
            {formatDate(createdAt)}
          </time>
          <span className="inline-flex items-center">
            <User2 className="h-3 w-3 inline mr-1" />
            {author.username}
          </span>
        </div>
        <CardTitle className="text-xl">
          <Link
            to={`/Post/${_id}`}
            className="hover:text-primary transition-colors"
            aria-label={`Read full post: ${title}`}
          >
            {title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <p className="line-clamp-3 text-muted-foreground">{summary}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <Link to={`/category/${category._id}`}>
          <Badge variant="outline" className="hover:bg-primary-50 hover:text-primary-700 transition-colors">
            {category.name}
          </Badge>
        </Link>
        <Link to={`/Post/${_id}`} className="text-primary text-sm font-medium hover:underline">
          Read more →
        </Link>
      </CardFooter>
    </Card>
  )
}

export type { PostType }

