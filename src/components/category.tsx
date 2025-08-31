"use client"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Badge } from "./ui/badge"
import { Folder } from "lucide-react"
import React from "react"
import { CategoryProps } from "../types/CategoryProps"
import { API_ENDPOINTS } from "../config/api.config"


const CategoryCard = ({ categoryId }: { categoryId: string }) => {
  const [categoryData, setCategoryData] = useState<CategoryProps | null>(null)

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.categories.detail(categoryId))

        if (!res.ok) {
          throw new Error(`Failed to fetch category: ${res.status}`)
        }

        const data = await res.json()
        // Handle the response structure (data or data.category)
        const categoryData = data.category || data
        setCategoryData(categoryData)
      } catch (error) {
        console.error("Error fetching category:", error)
      }
    }

    fetchCategory()
  }, [categoryId])

  return categoryData ? (
    <Link to={`/Category/${categoryData._id}`}>
      <Badge
        variant="outline"
        className="px-3 py-1 text-sm bg-background hover:bg-primary-50 hover:text-primary-700 transition-colors"
      >
        <Folder className="h-3.5 w-3.5 mr-1.5" />
        {categoryData.name}
      </Badge>
    </Link>
  ) : null
}

const CategoryCard2 = ({ category }: { category: CategoryProps }) => {
  return (
    <Link to={`/category/${category._id}`}>
      <Badge
        variant="outline"
        className="px-3 py-1 text-sm bg-background hover:bg-primary-50 hover:text-primary-700 transition-colors"
      >
        <Folder className="h-3.5 w-3.5 mr-1.5" />
        {category.name}
      </Badge>
    </Link>
  )
}

export default CategoryCard
export { CategoryCard2 }

