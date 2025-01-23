import React, { useState, createContext, useEffect } from "react";

type UserInfo = {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
  isAuthorized?: boolean;
} | null;

type UserContextType = {
  userInfo: UserInfo;
  setUserInfo: (user: UserInfo) => void;
  checkAuth: () => Promise<void>;
};

export const UserContext = createContext<UserContextType>({
  userInfo: null,
  setUserInfo: () => {},
  checkAuth: async () => {},
});

export const UserContextProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo>(null);

  const checkAuth = async () => {
    try {
      const response = await fetch("https://mern-backend-neon.vercel.app/verify-session", {
        credentials: "include",
      });
      
      const data = await response.json();
      
      if (response.ok && data.authenticated) {
        setUserInfo({
          id: data.user.id,
          username: data.user.username,
          role: data.user.role,
          isAuthorized: data.user.isAuthorized
        });
      } else {
        setUserInfo(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUserInfo(null);
    }
  };

  useEffect(() => {
    checkAuth();
    
    // Rafraîchissement périodique de la session
    const interval = setInterval(checkAuth, 15 * 60 * 1000); // Toutes les 15 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo, checkAuth }}>
      {children}
    </UserContext.Provider>
  );
};