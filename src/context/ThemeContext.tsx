import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'white' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isWhite: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  isWhite: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('modasr_theme_mode');
        if (saved === 'white' || saved === 'dark') return saved;
      } catch {
        // LocalStorage blocked
      }
    }
    return 'dark';
  });

  const applyThemeToDOM = (mode: ThemeMode) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    if (mode === 'white') {
      root.setAttribute('data-theme', 'white');
      root.classList.remove('dark', 'theme-dark');
      root.classList.add('theme-white', 'light');

      body.classList.remove('dark', 'theme-dark');
      body.classList.add('theme-white', 'light');
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#000000';
    } else {
      root.setAttribute('data-theme', 'dark');
      root.classList.remove('theme-white', 'light');
      root.classList.add('dark', 'theme-dark');

      body.classList.remove('theme-white', 'light');
      body.classList.add('dark', 'theme-dark');
      body.style.backgroundColor = '#0b0f17';
      body.style.color = '#f1f5f9';
    }
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('modasr_theme_mode', mode);
      } catch {
        // LocalStorage blocked
      }
      applyThemeToDOM(mode);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'white' ? 'dark' : 'white');
  };

  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isWhite: theme === 'white' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
