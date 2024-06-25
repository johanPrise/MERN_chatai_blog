import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Post from '../components/Post';
import CategoryCard2 from '../components/category';
import '../css/categoryPage.css';
import AnimateOnView from '../components/AnimateOnView';
import Pagination from '../components/pagination';

interface CategoryProps {
  _id: string;
  name: string;
  description?: string;
}


/**
 * Renders the category page with posts and categories.
 *
 * @return {JSX.Element} The category page component.
 */
const CategoryPage: React.FC = () => {
  const [posts, setPosts] = useState<PostProps[]>([]);
  const [category, setCategory] = useState<CategoryProps | null>(null);
  const [categories, setCategories] = useState<CategoryProps[]>([]);
  const { categoryId } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;
  const totalPages = Math.ceil(posts.length / postsPerPage);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    /**
     * Asynchronously fetches category, post, and category data from the API.
     *
     * @return {Promise<void>} A promise that resolves after fetching the data.
     */
    const fetchData = async () => {
      try {
        // Fetch category data
        const categoryResponse = await fetch(`/api/category/${categoryId}`);
        const categoryData = await categoryResponse.json();
        setCategory(categoryData);

        // Fetch post data
        const postResponse = await fetch("/api/post");
        const postData = await postResponse.json();
        setPosts(postData);

        // Fetch all categories
        const categoriesResponse = await fetch("/api/category");
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [categoryId]);

  if (!category) {
    return (
      <div className="loader mx-auto mt-8">
        <div className="bg-green-500 h-full rounded-full animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="dark:bg-gray-900 format format-sm sm:format-base lg:format-lg format-blue dark:format-invert antialiased p-4">
      <header className="category-header mb-4">
        <div className="Category-text text-center">
          <h1 className="category-title text-4xl font-bold mb-2 text-lime-600">{category.name}</h1>
          <p className="category-description mb-4 text-lime-500">{category.description}</p>
        </div>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex justify-center mb-4">
          <ol className="flex overflow-hidden rounded-md bg-lime-100 text-lime-600">
            <li className="flex items-center">
              <a href="/" className="flex h-10 items-center gap-1.5 px-4 transition hover:bg-lime-200 hover:text-lime-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 011 1m-6 0h6"
                  />
                </svg>
                <span className="ms-1.5 text-xs font-medium"> Home </span>
              </a>
            </li>
            <li className="relative flex items-center">
              <span className="absolute inset-y-0 -start-px h-10 w-4 bg-lime-100 [clip-path:_polygon(0_0,_0%_100%,_100%_50%)] rtl:rotate-180"></span>
              <a href="#" className="flex h-10 items-center bg-white pe-4 ps-8 text-xs font-medium transition hover:text-lime-700">
                {category.name}
              </a>
            </li>
          </ol>
        </nav>
      </header>
      <div className="posts p-6 grid">
        <div className="grid gap-4 gap-y-[2.75rem] grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {posts.length === 0 && (
            <div className="newtons-cradle flex mx-auto mt-8">
              <div className="newtons-cradle__dot"></div>
              <div className="newtons-cradle__dot"></div>
              <div className="newtons-cradle__dot"></div>
              <div className="newtons-cradle__dot"></div>
            </div>
          )}
          {posts
            .filter((post) => post.category === category._id)
            .slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage)
            .map((post) => (
              <AnimateOnView key={post._id}>
                <Post post={post}
                />
              </AnimateOnView>
            ))}
        </div>
      </div>
      <div className="pagination flex justify-center mb-8">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
      <div className="Categories-container">
        <h2 className="text-2xl font-bold mb-4">All Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <CategoryCard2 key={category._id} categoryId={category._id} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
