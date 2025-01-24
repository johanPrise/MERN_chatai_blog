import React, { createContext, useContext, useEffect, useState, ReactNode, Dispatch, SetStateAction } from "react";

export type UserInfo = { 
  id: string; 
  username: string;
  role?: string;
} | null;

interface UserContextType {
  userInfo: UserInfo;
  setUserInfo: Dispatch<SetStateAction<UserInfo>>;
  checkAuth: () => Promise<void>;
}




// Création du contexte avec une valeur par défaut typée explicitement
const UserContextScheme = createContext<UserContextType>({
  userInfo: null,
  setUserInfo: () => {}, // Fonction vide mais typée correctement
  checkAuth: async () => {}
} as UserContextType); // Assertion de type pour satisfaire TypeScript

export const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<UserInfo>(null);
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch('https://mern-backend-neon.vercel.app/verify-session', {
          credentials: 'include',
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUserInfo(userData);
        }
      } catch (error) {
        console.error('Session verification failed:', error);
      }
    };
  
    // Vérifier la session au montage ET après chaque navigation
    const interval = setInterval(verifySession, 3000); // Toutes les 3 secondes
    verifySession(); // Appel initial
    
    return () => clearInterval(interval);
  }, []);
  const checkAuth = async () => {
    // ... votre implémentation existante
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <UserContextScheme.Provider value={{ userInfo, setUserInfo, checkAuth }}>
      {children}
    </UserContextScheme.Provider>
  );
};

// Export du contexte avec typage explicite
export const UserContext = (): UserContextType => {
  return useContext(UserContextScheme);
};