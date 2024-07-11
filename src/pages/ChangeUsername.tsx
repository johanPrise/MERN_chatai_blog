import React, { useState, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';

const EditUsername: React.FC = () => {
  const [newUsername, setNewUsername] = useState('');
  const [redirect, setRedirect] = useState(false);

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    try {
      const response = await fetch('https://mern-backend-neon.vercel.app/edit-username', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newUsername }),
        credentials: 'include',
      });

      if (response.ok) {
        alert('Username updated successfully!');
        setRedirect(true);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update username. Please try again.');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      alert('An error occurred. Please try again.');
    }
  };

  if (redirect) {
    return <Navigate to="/" />;
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-center text-2xl font-bold text-lime-700 sm:text-3xl">
          Edit Username
        </h1>
        <form
          onSubmit={handleSubmit}
          className="mb-0 mt-6 space-y-4 rounded-lg p-4 shadow-lg sm:p-6 lg:p-8"
        >
          <div>
            <label htmlFor="newUsername" className="sr-only">New Username</label>
            <input
              type="text"
              id="newUsername"
              placeholder="Enter new username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              className="w-full rounded-lg border-gray-200 p-4 text-sm shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="block w-full rounded-lg bg-lime-700 px-5 py-3 text-sm font-medium text-white hover:bg-lime-800"
          >
            Update Username
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditUsername;