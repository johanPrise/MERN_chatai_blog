import React, { useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from './contexts/ThemeContext';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Composant pour basculer entre les thèmes (clair, sombre, système)
 */
const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    // Initialize with localStorage value or default to 'system'
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('themeMode') as ThemeMode | null;
      return stored || 'system';
    }
    return 'system';
  });

  // Determine if current theme is dark
  const isDark = theme === 'dark';

  // Changer le thème lorsque l'utilisateur clique sur le bouton
  const cycleTheme = () => {
    let nextTheme: ThemeMode;
    
    // Cycle: system -> light -> dark -> system
    if (themeMode === 'system') {
      nextTheme = 'light';
    } else if (themeMode === 'light') {
      nextTheme = 'dark';
    } else {
      nextTheme = 'system';
    }

    setThemeMode(nextTheme);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('themeMode', nextTheme);
    }
    
    // For now, when not in system mode, just toggle between light and dark
    if (nextTheme === 'light' || nextTheme === 'dark') {
      // Force the theme by calling toggleTheme if needed
      if ((nextTheme === 'dark' && theme === 'light') || (nextTheme === 'light' && theme === 'dark')) {
        toggleTheme();
      }
    } else {
      // System mode - let the system preference take over
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if ((systemPrefersDark && theme === 'light') || (!systemPrefersDark && theme === 'dark')) {
        toggleTheme();
      }
    }
  };

  // Déterminer l'icône à afficher en fonction du thème actuel
  const ThemeIcon = () => {
    if (themeMode === 'system') {
      return <Laptop className="h-5 w-5" />;
    }
    return isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />;
  };

  // Déterminer le texte du label
  const getLabel = () => {
    if (themeMode === 'system') return 'Système';
    return isDark ? 'Sombre' : 'Clair';
  };

  return (
    <button
      onClick={cycleTheme}
      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${className} ${
        isDark 
          ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
      }`}
      title={`Thème actuel: ${getLabel()}`}
      aria-label="Changer de thème"
    >
      <ThemeIcon />
      {showLabel && <span>{getLabel()}</span>}
    </button>
  );
};

export default ThemeToggle;
