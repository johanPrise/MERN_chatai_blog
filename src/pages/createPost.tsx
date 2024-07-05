// src/pages/CreatePost.tsx
import React, { useState, FormEvent, useEffect } from 'react';
import { Grid } from '@mui/material';
import ReactQuill from 'react-quill';
import { Navigate } from 'react-router-dom';
import 'react-quill/dist/quill.snow.css';
import '../css/App.css';

const CreatePost: React.FC = () => {
  const [title, setTitle] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [redirect, setRedirect] = useState<boolean>(false);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [featured, setFeatured] = useState<boolean>(false); // Ajout du state featured
const [isAuthorOrAdmin, setIsAuthorOrAdmin] = useState(false);

useEffect(() => {
  const checkAuthorAdminStatus = async () => {
    try {
      const response = await fetch('/check-author-admin', {
        credentials: 'include',
      });
      const data = await response.json();
      setIsAuthorOrAdmin(data.isAuthorOrAdmin);
    } catch (error) {
      console.error('Error checking author/admin status:', error);
      setIsAuthorOrAdmin(false);
    }
  };

  checkAuthorAdminStatus();
}, []);



// Le reste du code du composant...


  const createNewPost = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!files || files.length === 0) return;

    const data = new FormData();
    data.set('title', title);
    data.set('summary', summary);
    data.set('content', content);
    data.set('file', files[0]);
    data.set('category', selectedCategory);
    data.set('featured', featured.toString()); // Ajout du champ featured


    try {
      const response = await fetch('api/post/', {
        method: 'POST',
        body: data,
        credentials: 'include', // Ajoutez cette ligne
      });

      if (response.ok) {
        setRedirect(true);
        alert('Post created!');

      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch('https://mern-backend-neon.vercel.app/category');
      const data = await res.json();
      setCategories(data);
    };
    fetchCategories();
  }, []);


  if (redirect) {
    return <Navigate to="/" />;
  }

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

    return (
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
    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center text-2xl font-bold text-lime-600 sm:text-3xl">
          Create a New Post
        </h1>
        <form
          onSubmit={createNewPost}
          className="mb-0 mt-6 space-y-4 bg-white rounded-lg p-4 shadow-lg sm:p-6 lg:p-8"
        >
          <input
            type="text"
            placeholder="Enter your Title"
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
            required
            className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm"
          />
          <input
            type="text"
            placeholder="Enter your Summary"
            value={summary}
            onChange={(ev) => setSummary(ev.target.value)}
            required
            className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm"
          />
          <input
            type="file"
            onChange={(ev) => setFiles(ev.target.files)}
            required
            className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm"
          />
          <ReactQuill
            value={content}
            modules={modules}
            formats={formats}
            onChange={(newValue) => setContent(newValue)}
            className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm"
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Category:
            </label>
            <select
              title="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-lime-600 focus:ring-indigo-500"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Featured Post
            </label>
          </div>
          <button
            type="submit"
            className="block w-full rounded-lg bg-lime-600 px-5 py-3 text-sm font-medium text-white"
          >
            Create your post
          </button>
        </form>
      </div>
    </div>
});
}
;

export default CreatePost;
