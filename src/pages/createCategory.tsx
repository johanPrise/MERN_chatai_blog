// src/pages/CreateCategory.tsx
import React, { useState, FormEvent, useEffect } from 'react';
import { Grid } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../css/App.css';
import { Link } from 'react-router-dom';
/**
 * Handles the creation of a new category by sending a POST request to the '/api/category' endpoint.
 *
 * @param {FormEvent} ev - The form event triggering the category creation.
 * @return {void} No return value.
 */
const CreateCategory: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isAuthorOrAdmin, setIsAuthorOrAdmin] = useState(false);

useEffect(() => {
  const checkAuthorAdminStatus = async () => {
    try {
      const response = await fetch('https://mern-backend-neon.vercel.app/check-author-admin', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setIsAuthorOrAdmin(data.isAuthorOrAdmin);
    } catch (error) {
      console.error('Error checking author/admin status:', error);
      setIsAuthorOrAdmin(false);
    }
  };

  checkAuthorAdminStatus();
}, []);



/**
 * Asynchronously creates a new category by sending a POST request to the '/api/category' endpoint.
 *
 * @param {FormEvent} ev - The form event triggering the category creation.
 * @return {Promise<void>} A promise that resolves after the category is created successfully.
 */
  const createNewCategory = async (ev: FormEvent) => {
    ev.preventDefault();

    try {
      const response = await fetch('https://mern-backend-neon.vercel.app/category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
        credentials: 'include', // Ajoutez cette ligne
      });

      if (response.ok) {
        // Réinitialisez les champs du formulaire après la création réussie
        setName('');
        setDescription('');
        alert('Category created!');

      }
    } catch (error) {
      console.error(error);
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [
        { list: 'ordered' },
        { list: 'bullet' },
        { indent: '-1' },
        { indent: '+1' },
      ],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
  ];
if (!isAuthorOrAdmin) {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-center text-2xl font-bold text-indigo-600 sm:text-3xl">Accès Non Autorisé</h1>
        <p className="mx-auto mt-4 max-w-md text-center text-gray-500">
          Cette page est réservée aux auteurs et administrateurs. Veuillez vous connecter avec un compte approprié.
        </p>
      </div>
    </div>
  );
}else{
    return (
        // Dans le rendu du composant

    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-center text-2xl font-bold text-lime-600 sm:text-3xl">
          Create a New Category
        </h1>
        <form
          onSubmit={createNewCategory}
          className="mb-0 mt-6 space-y-4 bg-white rounded-lg p-4 shadow-lg sm:p-6 lg:p-8"
        >
          <input
            type="text"
            placeholder="Enter category name"
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            required
            className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm"
          />
          <ReactQuill
            value={description}
            modules={modules}
            formats={formats}
            onChange={(newValue) => setDescription(newValue)}
            className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm"
          />
          <button
            type="submit"
            className="block w-full rounded-lg bg-lime-600 px-5 py-3 text-sm font-medium text-white"
          >
            Create category
          </button>
        </form>
        <div className="flex justify-center m-4">
          <Link
            to="/deleteCategory"
            className="rounded-md bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
          >
            Delete category
          </Link>
        </div>
      </div>
    </div>
  );}
};

export default CreateCategory;
