import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme() || 'light';
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemColorScheme as ColorScheme);

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setColorSchemeState(savedTheme);
      } else {
        setColorSchemeState(systemColorScheme as ColorScheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      setColorSchemeState(systemColorScheme as ColorScheme);
    }
  };

  const setColorScheme = async (newTheme: ColorScheme) => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
      setColorSchemeState(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = colorScheme === 'dark' ? 'light' : 'dark';
    await setColorScheme(newTheme);
  };

  const value = {
    colorScheme,
    setColorScheme,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
} 