"use client"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Badge } from "./ui/badge"
import { Folder } from "lucide-react"
import React from "react"
import { CategoryProps } from "../types/CategoryProps"



const CategoryCard = ({ categoryId }: { categoryId: string }) => {
  const [categoryData, setCategoryData] = useState<CategoryProps | null>(null)

  useEffect(() => {
    const fetchCategory = async () => {
      const res = await fetch(`https://mern-backend-neon.vercel.app/category/${categoryId}`)
      const data = await res.json()
      setCategoryData(data)
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
    <Link to={`/Category/${category._id}`}>
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

