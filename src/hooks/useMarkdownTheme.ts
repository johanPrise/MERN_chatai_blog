import { useEffect, useState, useCallback } from 'react';
import { detectDarkMode, setupThemeListener } from '../lib/themeDetector';

type MarkdownTheme = {
  isDarkMode: boolean;
  themeVariables: Record<string, string>;
};

/**
 * Hook personnalisé pour gérer le thème du Markdown
 * @returns Informations sur le thème actuel et les variables CSS
 */
export const useMarkdownTheme = (): MarkdownTheme => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(detectDarkMode());

  // Mettre à jour le thème lorsque le mode sombre change
  useEffect(() => {
    setIsDarkMode(detectDarkMode());

    const cleanup = setupThemeListener((isDark) => {
      setIsDarkMode(isDark);
    });

    return cleanup;
  }, []);

  // Calculer les variables de thème CSS
  const themeVariables = {
    // Couleurs de texte
    '--md-text-heading': isDarkMode ? '#f5f5f5' : '#111827',
    '--md-text-body': isDarkMode ? '#d4d4d4' : '#374151',
    '--md-border': isDarkMode ? '#333' : '#e5e7eb',

    // Liens
    '--md-link': isDarkMode ? '#4ade80' : '#16a34a',
    '--md-link-hover': isDarkMode ? '#86efac' : '#15803d',

    // Citations
    '--md-blockquote-bg': isDarkMode ? '#222' : '#f9f9f9',
    '--md-blockquote-border': '#22c55e', // Même couleur pour les deux thèmes
    '--md-blockquote-text': isDarkMode ? '#b0b0b0' : '#555',

    // Code
    '--md-code-bg': isDarkMode ? 'rgba(240, 246, 252, 0.1)' : 'rgba(27, 31, 35, 0.05)',
    '--md-code-block-bg': isDarkMode ? '#1a1a1a' : '#f0f0f0',
    '--md-code-block-border': isDarkMode ? '#333' : '#ddd',

    // Tableaux
    '--md-table-border': isDarkMode ? '#333' : '#e2e8f0',
    '--md-table-header-bg': isDarkMode ? '#222' : '#f8fafc',
    '--md-table-row-hover': isDarkMode ? '#2a2a2a' : '#f1f5f9',

    // Bouton de copie de code
    '--md-copy-button-bg': isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)',
    '--md-copy-button-color': isDarkMode ? '#aaa' : '#555',
    '--md-copy-button-hover': isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  };

  return { isDarkMode, themeVariables };
};
