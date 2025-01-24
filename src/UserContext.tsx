import React, { createContext, useContext, useEffect, useState } from "react";

type User = { id: string; username: string } | null;

interface UserContextType {
  user: User;
  checkAuth: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  checkAuth: async () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);

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
    <UserContext.Provider value={{ user, checkAuth }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);