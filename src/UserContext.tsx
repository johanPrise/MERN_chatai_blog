import React from "react"
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react"
import { API_ENDPOINTS } from "./config/api.config"

export type UserInfo = {
  id: string
  username: string
  role?: string
} | null

interface UserContextType {
  userInfo: UserInfo
  setUserInfo: Dispatch<SetStateAction<UserInfo>>
  checkAuth: () => Promise<boolean>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
}

const UserContextScheme = createContext<UserContextType>({
  userInfo: null,
  setUserInfo: () => {},
  checkAuth: async () => false,
  login: async () => false,
  logout: async () => {},
  isLoading: true,
} as UserContextType)

export const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<UserInfo>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const checkAuth = async (): Promise<boolean> => {
    try {
      setIsLoading(true)

      const res = await fetch(API_ENDPOINTS.users.profile, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (res.ok) {
        const responseData = await res.json()

        let userData;

        if (responseData?.user?._id) {
          userData = responseData.user;
        } else if (responseData?._id) {
          userData = responseData;
        } else {
          setUserInfo(null)
          return false
        }

        setUserInfo({
          id: userData._id,
          username: userData.username,
          role: userData.role,
        })

        return true
      } else {
        setUserInfo(null)
        return false
      }
    } catch {
      setUserInfo(null)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginSuccess = (responseData: any): boolean => {
    if (!responseData?.user?._id) {
      return false
    }

    const userData = responseData.user
    setUserInfo({
      id: userData._id,
      username: userData.username,
      role: userData.role,
    })

    return true
  }

  const handleLoginError = async (res: Response): Promise<void> => {
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        await res.json()
      } catch {
        // ignore parse error
      }
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!email || !password) {
      return false
    }

    try {
      setIsLoading(true)

      const res = await fetch(API_ENDPOINTS.auth.login, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        const responseData = await res.json()
        return handleLoginSuccess(responseData)
      } else {
        await handleLoginError(res)
        return false
      }
    } catch {
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true)
      await fetch(API_ENDPOINTS.auth.logout, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
    } catch {
      // ignore network errors on logout
    } finally {
      setUserInfo(null)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()

    const interval = setInterval(() => {
      if (userInfo) {
        checkAuth()
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [userInfo?.id])

  const contextValue = useMemo(() => ({
    userInfo,
    setUserInfo,
    checkAuth,
    login,
    logout,
    isLoading
  }), [userInfo, isLoading])

  return (
    <UserContextScheme.Provider value={contextValue}>
      {children}
    </UserContextScheme.Provider>
  )
}

export const UserContext = (): UserContextType => {
  const context = useContext(UserContextScheme)

  if (context === undefined) {
    throw new Error('UserContext doit être utilisé à l\'intérieur d\'un UserContextProvider')
  }

  return context
}
