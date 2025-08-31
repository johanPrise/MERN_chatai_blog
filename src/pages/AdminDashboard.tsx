"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { UserContext } from "../UserContext"
import React from "react"
import { User as UserType } from "../types/User"
import { SearchAndSortControls } from "../components/SearchAndSortControls"
import {UsersTable} from "../components/UsersTable";
import {Pagination} from "../components/AdminPagination";
import { AddUserModal } from "../components/AddUserModal";
import { AdminStatistics } from "../components/AdminStatistics";

import AdminHeader from "../components/AdminHeader";
import { API_ENDPOINTS } from "../config/api.config"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw, AlertCircle, X } from "lucide-react"

// Main component
function AdminDashboard() {
  const [users, setUsers] = useState<UserType[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("username")
  const [order, setOrder] = useState("asc")
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"users" | "statistics">("users")
  const [retryCount, setRetryCount] = useState(0)
  const dashboardRef = useRef<HTMLDivElement>(null)

  // Use UserContext hook to access user context
  const { userInfo } = UserContext()

  // Check admin status using dedicated route
  const checkAdminStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      console.log("Checking admin status...")

      // Check if userInfo already contains the role
      if (userInfo && userInfo.role === 'admin') {
        console.log("User already identified as admin via userInfo")
        setIsAdmin(true)
        return
      }

      const response = await fetch(API_ENDPOINTS.auth.checkAdmin, {
        credentials: "include",
      })

      console.log("Admin check response:", response.status)

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = "Failed to verify admin status";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Error details:", errorData);
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        throw new Error(`${errorMessage} (${response.status})`);
      }

      const data = await response.json()
      console.log("Admin check data:", data)

      // The /auth/check-admin route returns { isAdmin: boolean }
      setIsAdmin(data.isAdmin)
    } catch (error) {
      console.error("Error checking admin status:", error)
      setIsAdmin(false)
      setError(`Unable to verify admin privileges: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }, [userInfo])

  // Fetch user list
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Build URL with query parameters
      const baseUrl = API_ENDPOINTS.users.list

      // Check if baseUrl is a full URL or relative path
      let url;
      try {
        // Try to create a full URL
        url = new URL(baseUrl);
      } catch (e) {
        // If baseUrl is a relative path, create a URL with the current origin
        url = new URL(baseUrl, window.location.origin);
      }

      // Add query parameters
      url.searchParams.append("page", page.toString())
      url.searchParams.append("search", search)
      url.searchParams.append("sort", sort)
      url.searchParams.append("order", order)

      console.log("Fetching users from URL:", url.toString())

      const response = await fetch(url.toString(), {
        credentials: "include",
      })

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = "Failed to fetch users";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Error details:", errorData);
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        throw new Error(`${errorMessage} (${response.status})`);
      }

      const data = await response.json();
      console.log("Received user data:", data);

      // Check if data contains a users array
      if (data && Array.isArray(data.users)) {
        setUsers(data.users);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        // If data is directly a user array
        setUsers(data);
        setTotalPages(1);
      } else {
        console.error("Unexpected data format:", data);
        throw new Error("Unexpected data format");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(`Unable to retrieve user list: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, sort, order])

  // Change user role
  const handleRoleChange = useCallback(async (userId: string, newRole: "user" | "author" | "admin" | "editor") => {
    setIsLoading(true)
    setError(null)

    try {
      console.log(`Changing role for user ${userId} to ${newRole}`)

      const response = await fetch(API_ENDPOINTS.users.changeRole(userId), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
        credentials: "include",
      })

      console.log("Role change response:", response.status)

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = "An error occurred while changing role";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Error details:", errorData);
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        throw new Error(`${errorMessage} (${response.status})`);
      }

      const data = await response.json()
      console.log("Role change data:", data)

      // Update UI with server data
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      )

      console.log(data.message || "Role changed successfully")
    } catch (error) {
      console.error("Error changing role:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Delete user
  const handleDeleteUser = useCallback(async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user ${username}?`)) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log(`Deleting user ${userId}`)

      const response = await fetch(API_ENDPOINTS.users.detail(userId), {
        method: "DELETE",
        credentials: "include",
      })

      console.log("User deletion response:", response.status)

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = "An error occurred while deleting user";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Error details:", errorData);
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        throw new Error(`${errorMessage} (${response.status})`);
      }

      const data = await response.json()
      console.log("User deletion data:", data)

      // Update UI by removing deleted user
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId))

      // Show success message
      alert(data.message || "User deleted successfully")
    } catch (error) {
      console.error("Error deleting user:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Send password reset email
  const handleResetPassword = useCallback(async (email: string, username: string) => {
    if (!window.confirm(`Send password reset email to ${username} (${email})?`)) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log(`Sending password reset to ${email}`)

      const response = await fetch(API_ENDPOINTS.auth.forgotPassword, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include",
      })

      console.log("Password reset response:", response.status)

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = "An error occurred while sending password reset email";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("Error details:", errorData);
        } catch (e) {
          console.error("Could not parse error response:", e);
        }
        throw new Error(`${errorMessage} (${response.status})`);
      }

      const data = await response.json()
      console.log("Password reset data:", data)

      // Show success message
      alert(data.message || "Password reset email sent successfully")
    } catch (error) {
      console.error("Error sending password reset email:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check admin status on load
  useEffect(() => {
    checkAdminStatus()
  }, [checkAdminStatus])

  // Fetch users when filters change
  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin, fetchUsers])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Refresh data with F5 or Ctrl/Cmd + R
      if (e.key === 'F5' || (e.key === 'r' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault()
        if (activeTab === 'users') {
          fetchUsers()
        } else {
          checkAdminStatus()
        }
      }
      
      // Open add user modal with Ctrl/Cmd + N
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        if (activeTab === 'users') {
          setIsAddUserModalOpen(true)
        }
      }
      
      // Close modals with ESC
      if (e.key === 'Escape') {
        setIsAddUserModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTab, fetchUsers, checkAdminStatus])

  // Auto-retry on error
  useEffect(() => {
    if (error && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1)
        if (activeTab === 'users') {
          fetchUsers()
        } else {
          checkAdminStatus()
        }
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [error, retryCount, activeTab, fetchUsers, checkAdminStatus])

  // Show message if user is not admin
  if (!userInfo || !isAdmin) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg">
          <h1 className="text-center text-2xl font-bold text-indigo-600 sm:text-3xl">Unauthorized Access</h1>
          <p className="mx-auto mt-4 max-w-md text-center text-gray-500">
            This page is reserved for administrators. Please log in with an administrator account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900" ref={dashboardRef}>
      {/* Enhanced header */}
      <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-grow py-6 pt-22">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          {/* Page title based on active tab */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {activeTab === "users" && "User Management"}
              {activeTab === "statistics" && "Site Statistics"}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {activeTab === "users" && "Manage users, their roles and permissions."}
              {activeTab === "statistics" && "View statistics and activity of your site."}
            </p>
          </motion.div>

          {/* Quick stats cards - only on users tab */}
          {activeTab === "users" && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-lime-100 dark:bg-lime-900 text-lime-600 dark:text-lime-400 mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">{users.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Authors</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {users.filter(user => user.role === 'author').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Editors</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {users.filter(user => user.role === 'editor').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administrators</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {users.filter(user => user.role === 'admin').length}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        {/* Main content based on active tab */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              className="space-y-6"
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Skeleton for stats cards */}
              {activeTab === "users" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full mr-4"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Skeleton for main content */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div 
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6"
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">An error occurred</h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => {
                        setError(null)
                        setRetryCount(0)
                        if (activeTab === 'users') fetchUsers()
                        else checkAdminStatus()
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${retryCount > 0 ? 'animate-spin' : ''}`} />
                      Retry
                    </button>
                    <button
                      onClick={() => setError(null)}
                      className="bg-white hover:bg-gray-50 text-red-600 border border-red-300 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Dismiss
                    </button>
                  </div>
                  {retryCount > 0 && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                      Retrying... ({retryCount}/3)
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Users tab */}
              {activeTab === "users" && (
                <>
                  {/* Search and sort controls */}
                  <SearchAndSortControls
                    search={search}
                    setSearch={setSearch}
                    sort={sort}
                    setSort={setSort}
                    order={order}
                    setOrder={setOrder}
                  />

                  {users.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                      </svg>
                      <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No users found</h3>
                      <p className="mt-1 text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
                    </div>
                  ) : (
                    <>
                      <UsersTable
                        users={users}
                        onRoleChange={handleRoleChange}
                        onDeleteUser={handleDeleteUser}
                        onResetPassword={handleResetPassword}
                      />

                      {/* Pagination */}
                      <div className="mt-6">
                        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Statistics tab */}
              {activeTab === "statistics" && (
                <AdminStatistics users={users} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

          {/* Quick actions - only visible in Users tab */}
          {activeTab === "users" && (
            <motion.div 
              className="mt-8 flex justify-end"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <button
                onClick={() => setIsAddUserModalOpen(true)}
                className="px-4 py-2 bg-lime-600 text-white rounded-md hover:bg-lime-700 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add User
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Blog AI - Admin Dashboard
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-lime-600 dark:hover:text-lime-500">
                Help
              </a>
              <a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-lime-600 dark:hover:text-lime-500">
                Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Add user modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserAdded={() => {
          fetchUsers();
          setIsAddUserModalOpen(false);
        }}
      />
    </div>
  )
}

export default AdminDashboard