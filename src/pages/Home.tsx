import React, { useEffect, useState } from "react";
import Featured from "../components/Featured";
import Post from "../components/Post";
import CategoryCard, { CategoryCard2 } from "../components/category";
import AnimateOnView from "../components/AnimateOnView";
import "../css/App.css"; // Assurez-vous que ce fichier contient le CSS personnalisé défini ci-dessus
import Pagination from "../components/pagination";
import { PostType } from "../components/Post";

interface HomeProps {
  featuredPosts: PostType[];
}



/**
 * Renders the Home component, which displays a list of posts and categories.
 *
 * @return {JSX.Element} The rendered Home component.
 */
export default function Home() {
  const [currentPage, setCurrentPage] = useState(1);

  const postsPerPage = 6;
  const [posts, setPosts] = useState([]);
  const totalPages = Math.ceil(posts.length / postsPerPage);
  const [categories, setCategories] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]); // Ajout du state featuredPosts
  


  /**
   * A description of the entire function.
   *
   * @param {number} page - description of parameter
   * @return {void} description of return value
   */
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };


  useEffect(() => {
    fetch('https://mern-backend-neon.vercel.app/post')
      .then(response => response.json())
      .then(posts => {
        setPosts(posts);
        setFeaturedPosts(posts.filter(post => post.featured));
      });
  }, []);
  
  useEffect(() => {
    fetch("https://mern-backend-neon.vercel.app/category").then((response) => {
      response.json().then((categories) => {
        setCategories(categories);
      });
    });
  }, []);
  /**
   * Returns the last featured post from the featuredPosts array.
   *
   * @return {PostType | null} The last featured post, or null if there are no featured posts.
   */
  const getLastFeaturedPost = () => {
    if (featuredPosts.length === 0) return null;
    return featuredPosts[featuredPosts.length - 1];
  };
  
  return (
    <div className="dark:bg-gray-900 format format-sm sm:format-base lg:format-lg format-blue dark:format-invert antialiased p-4">
      <header className="blog-header mb-4 bg-stone-200">
        <Featured featured={getLastFeaturedPost()} />
      </header>
      <div className="posts p-6 grid">
        <h1 className="text-4xl font-bold mb-4">All Posts</h1>
        <div className="grid gap-4 gap-y-[2.75rem] grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ">
          {posts.length === 0 && (
            <div className="newtons-cradle flex mx-auto mt-8">
              <div className="newtons-cradle__dot"></div>
              <div className="newtons-cradle__dot"></div>
              <div className="newtons-cradle__dot"></div>
              <div className="newtons-cradle__dot"></div>
            </div>
          )}
          {posts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage).map(post => (
            <AnimateOnView key={post._id}>
              <Post post={post} />
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
    <CategoryCard2 key={category._id} category={category} />
  ))}

        </div>
      </div>
    </div>
  );
}
