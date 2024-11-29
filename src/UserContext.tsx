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
      const response = await fetch("https://mern-backend-neon.vercel.app/profile", {
        credentials: "include"
      });
      if (response.ok) {
        const userInfo = await response.json();
        setUserInfo(userInfo);
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
  }, []);

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo, checkAuth }}>
      {children}
    </UserContext.Provider>
  );
};