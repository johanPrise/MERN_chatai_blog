// src/components/Layout.tsx
import React from 'react';
import Header from './header';
import { Outlet } from 'react-router-dom';

/**
 * Renders the Layout component with Header and Outlet components.
 *
 * @return {JSX.Element} The rendered Layout component
 */
const Layout: React.FC = () => {
  return (
    <main>
      <Header />
      <Outlet />
    </main>
  );
};

export default Layout;
