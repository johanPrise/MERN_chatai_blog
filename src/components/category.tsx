import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface CategoryProps {
  name: string;
  description?: string;
  _id: string;
}

/**
 * Renders a category card component based on the provided category ID.
 *
 * @param {Object} props - The component props.
 * @param {string} props.categoryId - The ID of the category to fetch and display.
 * @return {JSX.Element | null} The rendered category card component or null if the category data is not available.
 */
const CategoryCard = ({ categoryId }: { categoryId: string }) => {
  const [categoryData, setCategoryData] = useState<CategoryProps | null>(null);

  useEffect(() => {
    /**
     * Fetches category data based on the provided category ID asynchronously.
     *
     * @param {string} categoryId - The ID of the category to fetch.
     */
    const fetchCategory = async () => {
      const res = await fetch(`https://mern-backend-neon.vercel.app/category/${categoryId}`);
      const data = await res.json();
      setCategoryData(data);
    };

    fetchCategory();
  }, [categoryId]);

  return categoryData ? (
    <Link to={`/Category/${categoryData._id}`}>
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-sm transition-all duration-300 ease-out hover:bg-green-500 hover:text-white hover:scale-105">
        {categoryData.name}
      </div>
    </Link>
  ) : null;
};

/**
 * Renders a category card component based on the provided category data.
 *
 * @param {Object} props - The component props.
 * @param {CategoryProps} props.category - The category data to display.
 * @return {JSX.Element} The rendered category card component.
 */
const CategoryCard2 = ({ category }: { category: CategoryProps }) => {
  return (
    <Link to={`/Category/${category._id}`}>
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-sm transition-all duration-300 ease-out hover:bg-green-500 hover:text-white hover:scale-105">
        {category.name}
      </div>
    </Link>
  );
};

export default CategoryCard;
export { CategoryCard2 };
