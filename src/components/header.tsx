// src/components/Header.tsx
import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../UserContext';
import '../css/Link-header.css';

const Header: React.FC = () => {
  const { setUserInfo, userInfo } = useContext(UserContext);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [categories, setCategories] = useState([]);

  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await fetch("https://mern-backend-neon.vercel.app/profile", { credentials: "include" });
      if (!response.ok) throw new Error('Failed to fetch user info');
      const userInfo = await response.json();
      setUserInfo(userInfo);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  }, [setUserInfo]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('https://mern-backend-neon.vercel.app/category');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const categories = await response.json();
        setCategories(categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const logout = async () => {
    try {
      await fetch("https://mern-backend-neon.vercel.app/logout", { credentials: "include", method: "POST" });
      setUserInfo(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  const username = userInfo?.username;
  const role = userInfo?.role;
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isDropdownOpen) {
      setDropdownVisible(true);
    } else {
      timer = setTimeout(() => setDropdownVisible(false), 500);
    }
    return () => clearTimeout(timer);
  }, [isDropdownOpen]);

  return (
    <div className="relative bg-white shadow dark:bg-gray-800 sticky top-0 z-50">
      <div className="container px-6 py-3 mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="text-lime-800 p-2 rounded uppercase font-bold hover:bg-lime-700 hover:text-white">
                IWOMI BLOG {role}
              </Link>
            </div>
            <div className="flex lg:hidden">
              <button
                onClick={() => setMenuOpen(!isMenuOpen)}
                type="button"
                className="text-gray-500 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400 focus:outline-none focus:text-gray-600 dark:focus:text-gray-400"
                aria-label="toggle menu"
              >
                {isMenuOpen ? (
                  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div
            className={`absolute inset-x-0 z-20 px-6 py-2 transition-all duration-300 ease-in-out bg-white top-24 dark:bg-gray-800 md:mt-0 md:p-0 md:top-0 md:relative md:bg-transparent md:w-auto md:flex md:items-center ${
              isMenuOpen ? 'translate-x-0 opacity-100' : 'opacity-0 -translate-x-full md:translate-x-0 md:opacity-100'
            }`}
          >
            <div className="flex flex-col md:flex-row md:mx-1 relative">
              <div
                className="my-2 text-sm leading-5 text-gray-700 dark:text-gray-200 hover:text-lime-800 dark:hover:text-lime-400 hover:underline md:mx-4 md:my-0 cursor-pointer"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <p className="p-2 hover:text-white rounded ease-in-out hover:bg-lime-700">Categories</p>
                <div
                  className={`absolute z-10 mt-2 py-2 w-48 bg-white rounded-md shadow-xl dark:bg-gray-800 transition-opacity duration-500 ${
                    isDropdownVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {categories.map((category) => (
                    <Link 
                      key={category._id}
                      style={{ transform: isDropdownVisible ? 'translateY(0)' : 'translateY(20px)' }}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-lime-100 dark:hover:bg-gray-600 hover:text-lime-800 dark:hover:text-lime-400 transform transition-transform duration-500 ease-in-out"
                      to={`/category/${category._id}`}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 md:ml-6">
        {username ? (
          <>
            {(role === 'admin' || role === 'author') && (
              <>
                <Link to="/create_post" className="block hover:text-white rounded-md bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700">
                  Create Post
                </Link>
                <Link to="/create_category" className="block hover:text-white rounded-md bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700">
                  Create Category
                </Link>
              </>
            )}
            {role === 'admin' && (
              <Link to="/admin" className="block hover:text-white rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700">
                Admin Dashboard
              </Link>
            )}
            <button onClick={logout} className="rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-teal-600 transition hover:text-teal-600/75 sm:block">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login_page" className="block hover:text-white rounded-md bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700">
              Login
            </Link>
            <Link to="/register_page" className="hidden rounded-md bg-gray-100 px-5 py-2.5 text-sm font-medium text-lime-600 transition hover:text-lime-600/75 sm:block">
              Register
            </Link>
          </>
        )}
      </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
