import React, { createContext, useContext, useState } from 'react';

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
    inverse: '#000000',
  },
  border: '#38383a',
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
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
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
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 