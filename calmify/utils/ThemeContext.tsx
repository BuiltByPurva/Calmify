import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  text: {
    primary: string;
    secondary: string;
    inverse: string;
  };
  border: string;
}

const lightTheme: ThemeColors = {
  primary: '#007AFF',
  background: '#f5f5f5',
  card: '#ffffff',
  text: {
    primary: '#000000',
    secondary: '#666666',
    inverse: '#ffffff',
  },
  border: '#e0e0e0',
};

const darkTheme: ThemeColors = {
  primary: '#0A84FF',
  background: '#000000',
  card: '#1c1c1e',
  text: {
    primary: '#ffffff',
    secondary: '#8e8e93',
    inverse: '#ffffff',
  },
  border: '#2c2c2e',
};

interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useSystemColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      } else {
        setIsDark(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      setIsDark(systemColorScheme === 'dark');
    }
  };

  const toggleTheme = async () => {
    try {
      const newIsDark = !isDark;
      await AsyncStorage.setItem('theme', newIsDark ? 'dark' : 'light');
      setIsDark(newIsDark);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 