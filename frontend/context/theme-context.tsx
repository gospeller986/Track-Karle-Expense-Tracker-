import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

type Scheme = 'dark' | 'light';

const STORAGE_KEY = 'app_color_scheme';

interface ThemeContextValue {
  scheme: Scheme;
  toggleTheme: () => void;
  setScheme: (s: Scheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'dark',
  toggleTheme: () => {},
  setScheme: () => {},
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setSchemeState] = useState<Scheme>('dark');

  // Load persisted preference on mount
  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then(val => {
      if (val === 'light' || val === 'dark') setSchemeState(val);
    });
  }, []);

  const setScheme = useCallback((s: Scheme) => {
    setSchemeState(s);
    SecureStore.setItemAsync(STORAGE_KEY, s).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setSchemeState(prev => {
      const next: Scheme = prev === 'dark' ? 'light' : 'dark';
      SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ scheme, toggleTheme, setScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeScheme() {
  return useContext(ThemeContext);
}
