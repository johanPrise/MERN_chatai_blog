import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../UserContext';
interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'author' | 'admin';
}
function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('username');
  const [order, setOrder] = useState('asc');
  const { userInfo } = useContext(UserContext);

  useEffect(() => {
    checkAdminStatus();
  }, [userInfo]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, page, search, sort, order]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/check-admin', {
        credentials: 'include',
      });
      const data = await response.json();
      setIsAdmin(data.isAdmin);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users?page=${page}&search=${search}&sort=${sort}&order=${order}`, {
        credentials: 'include',
      });
      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

const handleRoleChange = async (userId: string, newRole: 'user' | 'author' | 'admin') => {
  setIsLoading(true);
  setError(null);

  try {
    const response = await fetch('/api/change-user-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, newRole }),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Une erreur est survenue lors du changement de rôle');
    }

    setUsers(prevUsers => 
      prevUsers.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      )
    );

    console.log(data.message);

  } catch (error) {
    console.error('Erreur lors du changement de rôle:', error);
    setError(error instanceof Error ? error.message : 'Une erreur inconnue est survenue');
  } finally {
    setIsLoading(false);
  }
};

  if (!userInfo || !isAdmin) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-center text-2xl font-bold text-indigo-600 sm:text-3xl">Accès Non Autorisé</h1>
          <p className="mx-auto mt-4 max-w-md text-center text-gray-500">
            Cette page est réservée aux administrateurs. Veuillez vous connecter avec un compte administrateur.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-center text-3xl font-bold text-indigo-600 mb-8">Tableau de Bord Administrateur</h1>
        
        <div className="mb-6 flex justify-between items-center">
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-md w-64"
          />
          <div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-2 border rounded-md mr-2"
            >
              <option value="username">Nom d'utilisateur</option>
              <option value="email">Email</option>
              <option value="role">Rôle</option>
            </select>
            <button
              onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 bg-gray-200 rounded-md"
            >
              {order === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center">Chargement des utilisateurs...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom d'utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user:User) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className="px-2 py-1 border rounded-md"
                      >
                        <option value="user">Utilisateur</option>
                        <option value="author">Auteur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex justify-center items-center">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md mr-2 disabled:bg-gray-400"
          >
            Précédent
          </button>
          <span className="mx-4">
            Page {page} sur {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md ml-2 disabled:bg-gray-400"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;