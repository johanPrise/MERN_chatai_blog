import { User as UserType } from "../types/User"
import React from "react"
import {getRoleColor} from "../lib/utils";

export const UsersTable = ({
  users,
  onRoleChange,
}: {
  users: UserType[]
  onRoleChange: (userId: string, newRole: "user" | "author" | "admin") => void
}) => {
  const confirmRoleChange = (userId: string, newRole: "user" | "author" | "admin", currentRole: string) => {
    if (newRole === currentRole) return

    if (window.confirm(`Êtes-vous sûr de vouloir changer le rôle de cet utilisateur en "${newRole}" ?`)) {
      onRoleChange(userId, newRole)
    }
  }

  return (
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
          {users.map((user: UserType) => (
            <tr key={user._id}>
              <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
              <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(user.role)}`}>
                  {user.role}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={user.role}
                  onChange={(e) => confirmRoleChange(user._id, e.target.value as "user" | "author" | "admin", user.role)}
                  className="px-2 py-1 border rounded-md"
                  aria-label={`Changer le rôle de ${user.username}`}
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
  )
}