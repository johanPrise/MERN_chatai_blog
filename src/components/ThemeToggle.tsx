import React, { useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { ThemeMode, detectDarkMode, getThemeMode, setThemeMode } from '../lib/themeDetector';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Composant pour basculer entre les thèmes (clair, sombre, système)
 */
const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getThemeMode());
  const [isDark, setIsDark] = useState<boolean>(detectDarkMode());

  // Mettre à jour l'état lorsque le thème change
  useEffect(() => {
    // Écouter les changements de thème
    const handleThemeChange = (event: CustomEvent<{ theme: ThemeMode }>) => {
      setThemeModeState(event.detail.theme);
    };

    // Vérifier l'état du mode sombre
    const checkDarkMode = () => {
      setIsDark(detectDarkMode());
    };

    // Ajouter les écouteurs d'événements
    window.addEventListener('themechange', handleThemeChange as EventListener);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', checkDarkMode);

    // Observer les changements sur le document
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'data-mode']
    });

    // Écouter les changements dans localStorage
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'theme') {
        setThemeModeState(event.newValue as ThemeMode || 'system');
        checkDarkMode();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Nettoyage
    return () => {
      window.removeEventListener('themechange', handleThemeChange as EventListener);
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', checkDarkMode);
      window.removeEventListener('storage', handleStorageChange);
      observer.disconnect();
    };
  }, []);

  // Changer le thème lorsque l'utilisateur clique sur le bouton
  const cycleTheme = () => {
    // Cycle: system -> light -> dark -> system
    const nextTheme: ThemeMode = 
      themeMode === 'system' ? 'light' :
      themeMode === 'light' ? 'dark' : 'system';

    setThemeMode(nextTheme);
    setThemeModeState(nextTheme);
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
