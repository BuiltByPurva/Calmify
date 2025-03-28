import { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

// Define theme types
type Theme = {
  primary: string;
  background: string;
  card: string;
  text: {
    primary: string;
    secondary: string;
    inverse: string;
  };
  border: string;
};

// Define themes
const lightTheme: Theme = {
  primary: '#FF69B4', // Hot Pink
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: {
    primary: '#000000',
    secondary: '#666666',
    inverse: '#FFFFFF',
  },
  border: 'rgba(0, 0, 0, 0.1)',
};

const darkTheme: Theme = {
  primary: '#FF69B4', // Keep the same primary color for consistency
  background: '#121212',
  card: '#1A1A1A',
  text: {
    primary: '#FFFFFF',
    secondary: '#A0A0A0',
    inverse: '#FFFFFF',
  },
  border: 'rgba(255, 255, 255, 0.1)',
};

type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');

  useEffect(() => {
    setIsDark(colorScheme === 'dark');
  }, [colorScheme]);

  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}