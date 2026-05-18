import { useCallback, useEffect, useState } from "react"
import { API_ENDPOINTS } from "../config/api.config"
import type { UserInfo } from "../UserContext"
import type { User } from "../types/User"
import { devError, devLog } from "../lib/devLogger"

export type AdminTab = "users" | "statistics"
export type UserRole = User["role"]

type UsersResponse = {
  users: User[]
  totalPages: number
}

const getErrorMessage = (error: unknown, fallback = "Unknown error") => {
  return error instanceof Error ? error.message : fallback
}

const readErrorResponse = async (response: Response, fallback: string) => {
  try {
    const errorData = await response.json()
    devError("Error details:", errorData)
    return errorData.message || fallback
  } catch (error) {
    devError("Could not parse error response:", error)
    return fallback
  }
}

const assertOkResponse = async (response: Response, fallback: string) => {
  if (response.ok) {
    return
  }

  const errorMessage = await readErrorResponse(response, fallback)
  throw new Error(`${errorMessage} (${response.status})`)
}

const buildUsersUrl = (page: number, search: string, sort: string, order: string) => {
  const baseUrl = API_ENDPOINTS.users.list
  const isAbsoluteUrl = baseUrl.startsWith("http://") || baseUrl.startsWith("https://")
  const url = isAbsoluteUrl ? new URL(baseUrl) : new URL(baseUrl, globalThis.location.origin)

  url.searchParams.append("page", page.toString())
  url.searchParams.append("search", search)
  url.searchParams.append("sort", sort)
  url.searchParams.append("order", order)

  return url
}

const normalizeUsersResponse = (data: unknown): UsersResponse => {
  if (data && typeof data === "object" && "users" in data) {
    const responseData = data as { users?: unknown; totalPages?: number }

    if (Array.isArray(responseData.users)) {
      return {
        users: responseData.users,
        totalPages: responseData.totalPages || 1,
      }
    }
  }

  if (Array.isArray(data)) {
    return {
      users: data,
      totalPages: 1,
    }
  }

  devError("Unexpected data format:", data)
  throw new Error("Unexpected data format")
}

const verifyAdminStatus = async (userInfo: UserInfo) => {
  devLog("Checking admin status...")
  devLog("Current user role hint:", userInfo?.role)

  const response = await fetch(API_ENDPOINTS.auth.checkAdmin, {
    credentials: "include",
  })

  devLog("Admin check response:", response.status)
  await assertOkResponse(response, "Failed to verify admin status")

  const data = await response.json()
  devLog("Admin check data:", data)

  return Boolean(data.isAdmin)
}

const fetchUsersPage = async (page: number, search: string, sort: string, order: string) => {
  const url = buildUsersUrl(page, search, sort, order)
  devLog("Fetching users from URL:", url.toString())

  const response = await fetch(url.toString(), {
    credentials: "include",
  })

  await assertOkResponse(response, "Failed to fetch users")

  const data = await response.json()
  devLog("Received user data:", data)

  return normalizeUsersResponse(data)
}

const updateUserRole = async (userId: string, newRole: UserRole) => {
  devLog(`Changing role for user ${userId} to ${newRole}`)

  const response = await fetch(API_ENDPOINTS.users.changeRole(userId), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role: newRole }),
    credentials: "include",
  })

  devLog("Role change response:", response.status)
  await assertOkResponse(response, "An error occurred while changing role")

  const data = await response.json()
  devLog("Role change data:", data)
  devLog(data.message || "Role changed successfully")
}

const deleteUser = async (userId: string) => {
  devLog(`Deleting user ${userId}`)

  const response = await fetch(API_ENDPOINTS.users.detail(userId), {
    method: "DELETE",
    credentials: "include",
  })

  devLog("User deletion response:", response.status)
  await assertOkResponse(response, "An error occurred while deleting user")

  const data = await response.json()
  devLog("User deletion data:", data)

  return data.message || "User deleted successfully"
}

const sendPasswordReset = async (email: string) => {
  devLog(`Sending password reset to ${email}`)

  const response = await fetch(API_ENDPOINTS.auth.forgotPassword, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
    credentials: "include",
  })

  devLog("Password reset response:", response.status)
  await assertOkResponse(response, "An error occurred while sending password reset email")

  const data = await response.json()
  devLog("Password reset data:", data)

  return data.message || "Password reset email sent successfully"
}

export const useAdminDashboard = (userInfo: UserInfo) => {
  const [users, setUsers] = useState<User[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("username")
  const [order, setOrder] = useState("asc")
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>("users")
  const [retryCount, setRetryCount] = useState(0)

  const checkAdminStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      setIsAdmin(await verifyAdminStatus(userInfo))
    } catch (error) {
      devError("Error checking admin status:", error)
      setIsAdmin(false)
      setError(`Unable to verify admin privileges: ${getErrorMessage(error)}`)
    } finally {
      setIsLoading(false)
    }
  }, [userInfo])

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchUsersPage(page, search, sort, order)
      setUsers(data.users)
      setTotalPages(data.totalPages)
    } catch (error) {
      devError("Error fetching users:", error)
      setError(`Unable to retrieve user list: ${getErrorMessage(error)}`)
    } finally {
      setIsLoading(false)
    }
  }, [page, search, sort, order])

  const handleRoleChange = useCallback(async (userId: string, newRole: UserRole) => {
    setIsLoading(true)
    setError(null)

    try {
      await updateUserRole(userId, newRole)
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      )
    } catch (error) {
      devError("Error changing role:", error)
      setError(getErrorMessage(error, "An unknown error occurred"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDeleteUser = useCallback(async (userId: string, username: string) => {
    if (!globalThis.confirm(`Are you sure you want to delete user ${username}?`)) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const message = await deleteUser(userId)
      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId))
      globalThis.alert(message)
    } catch (error) {
      devError("Error deleting user:", error)
      setError(getErrorMessage(error, "An unknown error occurred"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleResetPassword = useCallback(async (email: string, username: string) => {
    if (!globalThis.confirm(`Send password reset email to ${username} (${email})?`)) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const message = await sendPasswordReset(email)
      globalThis.alert(message)
    } catch (error) {
      devError("Error sending password reset email:", error)
      setError(getErrorMessage(error, "An unknown error occurred"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshActiveTab = useCallback(() => {
    const refresh = activeTab === "users" ? fetchUsers : checkAdminStatus
    void refresh()
  }, [activeTab, fetchUsers, checkAdminStatus])

  useEffect(() => {
    void checkAdminStatus()
  }, [checkAdminStatus])

  useEffect(() => {
    if (isAdmin) {
      void fetchUsers()
    }
  }, [isAdmin, fetchUsers])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isRefreshShortcut = event.key === "F5" || (event.key === "r" && (event.ctrlKey || event.metaKey))
      const isNewUserShortcut = activeTab === "users" && (event.ctrlKey || event.metaKey) && event.key === "n"

      if (isRefreshShortcut) {
        event.preventDefault()
        refreshActiveTab()
      }

      if (isNewUserShortcut) {
        event.preventDefault()
        setIsAddUserModalOpen(true)
      }

      if (event.key === "Escape") {
        setIsAddUserModalOpen(false)
      }
    }

    globalThis.addEventListener("keydown", handleKeyDown)
    return () => globalThis.removeEventListener("keydown", handleKeyDown)
  }, [activeTab, refreshActiveTab])

  useEffect(() => {
    if (!error || retryCount >= 3) {
      return
    }

    const timer = setTimeout(() => {
      setRetryCount((prev) => prev + 1)
      refreshActiveTab()
    }, 3000)

    return () => clearTimeout(timer)
  }, [error, retryCount, refreshActiveTab])

  return {
    users,
    isAdmin,
    isLoading,
    error,
    page,
    totalPages,
    search,
    sort,
    order,
    isAddUserModalOpen,
    activeTab,
    retryCount,
    setPage,
    setSearch,
    setSort,
    setOrder,
    setError,
    setRetryCount,
    setIsAddUserModalOpen,
    setActiveTab,
    fetchUsers,
    checkAdminStatus,
    handleRoleChange,
    handleDeleteUser,
    handleResetPassword,
  }
}
