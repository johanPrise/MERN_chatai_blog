import React from "react"
import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import type { Post as PostType } from "../types/PostType"
import AnimateOnView from "./AnimateOnView"
import { formatDate } from "../lib/utils"
import { CalendarIcon, User2, Clock, Sparkles, TrendingUp, Star, BookOpen, ArrowRight } from "lucide-react"
import { Badge } from "./ui/badge"

interface LatestArticleProps {
  post: PostType | null
}

const LatestArticle: React.FC<LatestArticleProps> = ({ post }) => {
  if (!post) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-secondary/5 to-emerald-500/5 border border-primary/20 shadow-lg">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[url('/patterns/dots.svg')] opacity-5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl animate-pulse"></div>
        
        <div className="relative p-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-muted/50 to-muted/30 rounded-full flex items-center justify-center ring-4 ring-primary/10 shadow-inner">
            <Clock className="w-10 h-10 text-muted-foreground animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-muted-foreground mb-3 tracking-tight">No Recent Articles</h3>
          <p className="text-muted-foreground/80 max-w-sm mx-auto leading-relaxed">Stay tuned for fresh content and exciting new articles coming soon!</p>
          
          {/* Decorative elements */}
          <div className="flex justify-center gap-2 mt-6 opacity-30">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  const { _id, title, summary, author, createdAt } = post

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/8 via-secondary/6 to-emerald-500/8 border border-primary/20 group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-700 hover:scale-[1.02]">
      {/* Enhanced background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5 group-hover:opacity-10 transition-opacity duration-500"></div>
      
      {/* Multiple floating orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/15 to-transparent rounded-full blur-3xl opacity-60 group-hover:opacity-90 transition-all duration-500 group-hover:scale-110" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/15 to-transparent rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-all duration-500 group-hover:scale-105" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-secondary/10 to-transparent rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-all duration-700" />
      
      {/* Enhanced floating elements */}
      <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-40 transition-all duration-500 group-hover:rotate-12">
        <Star className="w-8 h-8 text-primary animate-pulse" />
      </div>
      <div className="absolute top-6 left-6 opacity-15 group-hover:opacity-30 transition-all duration-700">
        <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
      
      <div className="relative p-8 lg:p-12">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          {/* Content Section */}
          <div className="lg:w-2/3 relative z-10">
            <AnimateOnView animation="fade" delay={100}>
              {/* Enhanced badges section */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Badge className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white border-0 px-5 py-2.5 text-sm font-bold shadow-xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105">
                  <TrendingUp className="w-4 h-4 mr-2 animate-pulse" />
                  Latest Article
                </Badge>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full backdrop-blur-sm border border-primary/20">
                  <div className="relative">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-sm text-primary font-semibold tracking-wide">Fresh Content</span>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary/80 hover:bg-primary/5 transition-colors duration-300">
                  <BookOpen className="w-3 h-3 mr-1" />
                  New
                </Badge>
              </div>
              
              {/* Enhanced title with gradient */}
              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black mb-6 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent group-hover:from-primary group-hover:via-primary group-hover:to-emerald-600 transition-all duration-500 leading-tight tracking-tight">
                {title}
              </h1>
              
              {/* Enhanced meta information */}
              <div className="flex flex-wrap items-center gap-4 mb-8 text-sm">
                <div className="flex items-center gap-2 px-4 py-2 bg-background/60 rounded-full backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 group/meta">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-emerald-500/20 rounded-full flex items-center justify-center group-hover/meta:scale-110 transition-transform duration-300">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                  </div>
                  <time dateTime={new Date(createdAt).toISOString()} className="font-medium text-muted-foreground group-hover/meta:text-foreground transition-colors duration-300">
                    {formatDate(createdAt)}
                  </time>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-background/60 rounded-full backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 group/author">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary/30 to-emerald-500/30 rounded-full flex items-center justify-center ring-2 ring-primary/20 group-hover/author:ring-primary/40 group-hover/author:scale-110 transition-all duration-300">
                    <User2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold text-muted-foreground group-hover/author:text-foreground transition-colors duration-300">{author.username}</span>
                </div>
              </div>
              
              {/* Enhanced summary */}
              {summary && (
                <div className="relative mb-8">
                  <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-primary to-emerald-500 rounded-full opacity-30"></div>
                  <p className="text-lg text-muted-foreground leading-relaxed line-clamp-3 font-medium tracking-wide pl-6">
                    {summary}
                  </p>
                </div>
              )}
            </AnimateOnView>
          </div>
          
          {/* Enhanced CTA Section */}
          <div className="lg:w-1/3 relative z-10">
            <AnimateOnView animation="slide-left" delay={200}>
              <div className="relative bg-card/70 backdrop-blur-md rounded-3xl p-8 border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 group/cta">
                {/* CTA background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-emerald-500/5 rounded-3xl opacity-0 group-hover/cta:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-xl opacity-50 group-hover/cta:opacity-70 transition-opacity duration-500"></div>
                
                <div className="relative text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/30 to-emerald-500/30 rounded-full flex items-center justify-center ring-4 ring-primary/15 shadow-lg group-hover/cta:ring-primary/25 group-hover/cta:scale-110 transition-all duration-500">
                    <BookOpen className="w-10 h-10 text-primary group-hover/cta:rotate-12 transition-transform duration-500" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover/cta:text-primary transition-colors duration-300">Ready to Explore?</h3>
                  <p className="text-sm text-muted-foreground mb-8 leading-relaxed">Dive into this captivating article and discover fresh insights that will expand your perspective.</p>
                  
                  {/* Enhanced progress indicator */}
                  <div className="flex justify-center gap-1 mb-6">
                    <div className="w-8 h-1 bg-primary rounded-full"></div>
                    <div className="w-4 h-1 bg-primary/50 rounded-full"></div>
                    <div className="w-2 h-1 bg-primary/30 rounded-full"></div>
                  </div>
                  
                  <Link to={`/Post/${_id}`} className="no-underline">
                    <Button className="w-full bg-gradient-to-r from-primary via-primary to-emerald-500 hover:from-primary/90 hover:via-emerald-500/90 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-primary/25 transition-all duration-500 group/button hover:scale-105 relative overflow-hidden">
                      {/* Button shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/button:translate-x-full transition-transform duration-700"></div>
                      <span className="relative">Read Latest Article</span>
                      <ArrowRight className="w-5 h-5 ml-3 group-hover/button:translate-x-2 transition-transform duration-300 relative" />
                    </Button>
                  </Link>
                  
                  {/* Reading time estimate */}
                  <div className="mt-4 text-xs text-muted-foreground/70 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>5 min read</span>
                  </div>
                </div>
              </div>
            </AnimateOnView>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LatestArticle