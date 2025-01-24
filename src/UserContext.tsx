import React, { createContext, useContext, useEffect, useState } from "react";

type User = { id: string; username: string } | null;

interface UserContextType {
    user: User;
    setUser: React.Dispatch<React.SetStateAction<User>>;
    checkAuth: () => Promise<void>;
  }

// Création du contexte
const UserContextScheme = createContext<UserContextType>({
    user: null,
    setUser: () => {},
    checkAuth: async () => {},
  });

// Export du Provider avec le bon nom
export const UserContextProvider = ({ children }: { children: React.ReactNode }) => {
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
  <UserContextScheme.Provider value={{ user, setUser, checkAuth }}>
    {children}
  </UserContextScheme.Provider>
  );
};

// Export du hook personnalisé
export const UserContext = () => useContext(UserContextScheme);