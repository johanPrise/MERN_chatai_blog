import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Category {
  _id: string;
  name: string;
  description?: string;
}

const DeleteCategories: React.FC = () => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('https://mern-backend-neon.vercel.app/category');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des catégories', error);
      }
    };
    fetchCategories();
  }, []);

  const handleCheckboxChange = (categoryId: string) => {
    setSelectedCategories((prevSelectedCategories) => {
      if (prevSelectedCategories.includes(categoryId)) {
        return prevSelectedCategories.filter((id) => id !== categoryId);
      } else {
        return [...prevSelectedCategories, categoryId];
      }
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await Promise.all(
        selectedCategories.map(async (categoryId) => {
          const response = await fetch(`api/category/${categoryId}`, {
            method: 'DELETE',
            credentials: 'include', // Ajoutez cette ligne
          });

          if (!response.ok) {
            console.error('Erreur lors de la suppression de la catégorie', categoryId);
          }
        })
      );
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la suppression des catégories', error);
    }
    setIsDeleting(false);
  };

    return (
    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-center text-2xl font-bold text-lime-600 sm:text-3xl">
          Delete Categories
        </h1>
        <div className="mb-0 mt-6 space-y-4 bg-white rounded-lg p-4 shadow-lg sm:p-6 lg:p-8">
          {categories.map((category) => (
            <div key={category._id} className="flex items-center">
              <input
                type="checkbox"
                id={category._id}
                checked={selectedCategories.includes(category._id)}
                onChange={() => handleCheckboxChange(category._id)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor={category._id}
                className="ml-2 block text-sm text-gray-900"
              >
                {category.name}
              </label>
            </div>
          ))}
          <button
            className="block w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-medium text-white"
            onClick={handleDelete}
            disabled={isDeleting || selectedCategories.length === 0}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCategories;
