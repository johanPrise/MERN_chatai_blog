import React, { useEffect, useState } from "react";
import Featured from "../components/Featured";
import Post from "../components/Post";
import CategoryCard, { CategoryCard2 } from "../components/category";
import AnimateOnView from "../components/AnimateOnView";
import "../css/App.css";
import Pagination from "../components/pagination";
import { PostType } from "../components/Post";

interface HomeProps {
  featuredPosts: PostType[];
}

export default function Home() {
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;
  const [posts, setPosts] = useState([]);
  const totalPages = Math.ceil(posts.length / postsPerPage);
  const [categories, setCategories] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);

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
    fetch("https://mern-backend-neon.vercel.app/category")
      .then((response) => response.json())
      .then((categories) => {
        setCategories(categories);
      });
  }, []);

  const getLastFeaturedPost = () => {
    if (featuredPosts.length === 0) return null;
    return featuredPosts[featuredPosts.length - 1];
  };

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 bg-stone-200 dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <Featured featured={getLastFeaturedPost()} />
        </header>

        <main>
          <section className="mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold mb-6">All Posts</h1>
            {posts.length === 0 ? (
              <div className="newtons-cradle flex justify-center items-center h-40">
                <div className="newtons-cradle__dot"></div>
                <div className="newtons-cradle__dot"></div>
                <div className="newtons-cradle__dot"></div>
                <div className="newtons-cradle__dot"></div>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {posts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage).map(post => (
                  <AnimateOnView key={post._id}>
                    <Post post={post} />
                  </AnimateOnView>
                ))}
              </div>
            )}
          </section>

          <div className="flex justify-center mb-12">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>

          <section>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">All Categories</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <CategoryCard2 key={category._id} category={category} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
