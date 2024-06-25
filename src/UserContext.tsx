import React, {useState, createContext} from "react";
export const UserContext = createContext({});

/**
 * Renders the User Context Provider component with the provided children.
 *
 * @param {Object} children - The children components to be rendered within the provider.
 * @return {JSX.Element} The User Context Provider component.
 */
export const UserContextProvider = ({ children }) => {
    const [userInfo, setUserInfo] = useState({});
    return (
        <UserContext.Provider value={{ userInfo, setUserInfo }}>
            {children}
        </UserContext.Provider>
    );
};
