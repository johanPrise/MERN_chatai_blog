import React, { createContext, useContext, useEffect, useState } from "react";

type User = { id: string; username: string } | null;

interface UserContextType {
  user: User;
  setUserInfo: React.Dispatch<React.SetStateAction<User>>; // Renommez setUser en setUserInfo
  checkAuth: () => Promise<void>;
}

const UserContextScheme = createContext<UserContextType>({
  user: null,
  setUserInfo: () => {}, // Gardez le nom existant
  checkAuth: async () => {},
});

export const UserContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);

  // Renommez la fonction interne
  const setUserInfo: UserContextType['setUserInfo'] = setUser;

  const checkAuth = async () => {
    try {
      const response = await fetch('https://mern-backend-neon.vercel.app/verify-session', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <UserContextScheme.Provider value={{ user, setUserInfo, checkAuth }}>
      {children}
    </UserContextScheme.Provider>
  );
};

// Exportez le contexte directement
export const UserContext = UserContextScheme;