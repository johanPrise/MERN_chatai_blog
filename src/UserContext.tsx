import React, { createContext, useContext, useEffect, useState } from "react";

type User = { id: string; username: string } | null;

interface UserContextType {
  user: User;
  checkAuth: () => Promise<void>;
}

const UserContext_0 = createContext<UserContextType>({
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
    <UserContext_0.Provider value={{ user, checkAuth }}>
      {children}
    </UserContext_0.Provider>
  );
};

export const UserContext = () => useContext(UserContext_0);