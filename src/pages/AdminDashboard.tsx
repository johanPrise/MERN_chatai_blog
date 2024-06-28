// AdminDashboard.tsx
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../UserContext';

function AdminDashboard() {
  const [pendingAuthors, setPendingAuthors] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const { userInfo } = useContext(UserContext);

  useEffect(() => {
    if (userInfo?.role === 'admin') {
      // Vérification supplémentaire côté serveur
      fetch('/api/check-admin', {
        credentials: 'include',
      })
        .then(response => response.json())
        .then(data => {
          if (data.isAdmin) {
            setIsAdmin(true);
            fetchPendingAuthors();
          } else {
            setIsAdmin(false);
          }
        })
        .catch(error => {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        });
    }
  }, [userInfo]);

  const fetchPendingAuthors = () => {
    fetch('/api/pending-authors', {
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => setPendingAuthors(data))
      .catch(error => console.error('Error fetching pending authors:', error));
  };

  const handleAuthorize = (userId) => {
    fetch('/api/authorize-author', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
      credentials: 'include',
    })
      .then(response => {
        if (response.ok) {
          fetchPendingAuthors();
        }
      })
      .catch(error => console.error('Error authorizing author:', error));
  };

  if (!userInfo || !isAdmin) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-center text-2xl font-bold text-indigo-600 sm:text-3xl">Accès Non Autorisé</h1>
          <p className="mx-auto mt-4 max-w-md text-center text-gray-500">
            Cette page est réservée aux administrateurs. Veuillez gentiment sortir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-center text-2xl font-bold text-indigo-600 sm:text-3xl">Admin Dashboard</h1>
        <p className="mx-auto mt-4 max-w-md text-center text-gray-500">
          Gérez les demandes d'auteurs en attente et autorisez-les à publier sur la plateforme.
        </p>
        <div className="mb-0 mt-6 space-y-4 rounded-lg p-4 shadow-lg sm:p-6 lg:p-8">
          <p className="text-center text-lg font-medium">Pending Author Requests</p>
          <ul className="space-y-4">
            {pendingAuthors.map(author => (
              <li key={author._id} className="flex items-center justify-between">
                <span>{author.username} ({author.email})</span>
                <button
                  onClick={() => handleAuthorize(author._id)}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white"
                >
                  Authorize
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;