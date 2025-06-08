// Types pour la gestion du thème
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Détecte le mode sombre en fonction des préférences de l'utilisateur et de la configuration du site
 * @returns {boolean} True si le mode sombre est actif, false sinon
 */
export const detectDarkMode = (): boolean => {
  // Vérifier la préférence du système
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Vérifier le thème stocké dans localStorage
  const storedTheme = localStorage.getItem('theme') as ThemeMode | null;

  // Vérifier si le document a la classe .dark (pour les frameworks comme Tailwind)
  const documentHasDarkClass = document.documentElement.classList.contains('dark');

  // Vérifier les attributs data-theme ou data-mode
  const htmlElement = document.documentElement;
  const dataTheme = htmlElement.getAttribute('data-theme');
  const dataMode = htmlElement.getAttribute('data-mode');

  // Vérifier la préférence utilisateur stockée
  if (storedTheme) {
    if (storedTheme === 'dark') return true;
    if (storedTheme === 'light') return false;
    // Si 'system', continuer avec les autres vérifications
  }

  // Déterminer si le mode sombre est actif
  return documentHasDarkClass || 
         dataTheme === 'dark' || 
         dataMode === 'dark' || 
         systemPrefersDark;
};

/**
 * Configure un écouteur pour les changements de thème
 * @param callback - Fonction à appeler lorsque le thème change
 * @returns Fonction pour nettoyer les écouteurs
 */
export const setupThemeListener = (callback: (isDarkMode: boolean) => void): () => void => {
  // Fonction pour vérifier l'état du mode sombre et appeler le callback
  const checkAndNotify = () => {
    const isDark = detectDarkMode();
    callback(isDark);
  };

  // Observer les changements de préférences système
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleMediaChange = () => checkAndNotify();
  mediaQuery.addEventListener('change', handleMediaChange);

  // Observer les changements de classe sur le document
  const observer = new MutationObserver(checkAndNotify);
  observer.observe(document.documentElement, { 
    attributes: true,
    attributeFilter: ['class', 'data-theme', 'data-mode']
  });

  // Observer les changements dans localStorage
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'theme') {
      checkAndNotify();
    }
  };
  window.addEventListener('storage', handleStorageChange);

  // Fonction de nettoyage pour les écouteurs
  return () => {
    mediaQuery.removeEventListener('change', handleMediaChange);
    window.removeEventListener('storage', handleStorageChange);
    observer.disconnect();
  };
};

/**
 * Définit le thème de l'application
 * @param mode - Mode de thème à appliquer ('light', 'dark', ou 'system')
 */
export const setThemeMode = (mode: ThemeMode): void => {
  // Sauvegarder la préférence utilisateur
  localStorage.setItem('theme', mode);

  // Appliquer le thème
  const htmlElement = document.documentElement;

  if (mode === 'system') {
    // Supprimer les classes et attributs pour revenir au thème système
    htmlElement.classList.remove('light', 'dark');
    htmlElement.removeAttribute('data-theme');
    htmlElement.removeAttribute('data-mode');

    // Appliquer le thème système
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (systemPrefersDark) {
      htmlElement.classList.add('dark');
      htmlElement.setAttribute('data-theme', 'dark');
    } else {
      htmlElement.classList.add('light');
      htmlElement.setAttribute('data-theme', 'light');
    }
  } else {
    // Appliquer directement le thème spécifié
    htmlElement.classList.remove('light', 'dark');
    htmlElement.classList.add(mode);
    htmlElement.setAttribute('data-theme', mode);
    htmlElement.setAttribute('data-mode', mode);
  }

  // Déclencher un événement personnalisé pour notifier le changement de thème
  window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: mode } }));
};

/**
 * Récupère le mode de thème actuel
 * @returns Le mode de thème actuel ('light', 'dark', ou 'system')
 */
export const getThemeMode = (): ThemeMode => {
  const storedTheme = localStorage.getItem('theme') as ThemeMode | null;
  return storedTheme || 'system';
};

/**
 * Bascule entre les modes clair et sombre
 */
export const toggleTheme = (): void => {
  const isDark = detectDarkMode();
  setThemeMode(isDark ? 'light' : 'dark');
};

/**
 * Convertit un thème de l'éditeur en fonction du mode sombre/clair
 * @param lightTheme - Thème pour le mode clair
 * @param darkTheme - Thème pour le mode sombre
 * @returns Le thème approprié en fonction du mode actuel
 */
export const getEditorTheme = <T>(lightTheme: T, darkTheme: T): T => {
  return detectDarkMode() ? darkTheme : lightTheme;
};

/**
 * Initialise le thème au chargement de l'application
 */
export const initializeTheme = (): void => {
  const storedTheme = getThemeMode();

  // Appliquer le thème stocké
  if (storedTheme !== 'system') {
    setThemeMode(storedTheme);
  } else {
    // Pour le mode système, appliquer le thème en fonction des préférences du système
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', systemPrefersDark);
    document.documentElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
  }

  // Ajouter une classe spéciale pour éviter les flashs lors du chargement de la page
  document.documentElement.classList.add('theme-initialized');
};
