import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedTheme = await SecureStore.getItemAsync('theme');
      if (storedTheme) {
        setIsDark(storedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await SecureStore.setItemAsync('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = {
    colors: {
      primary: '#4a90e2',
      secondary: '#f39c12',
      background: isDark ? '#1a1a2e' : '#ffffff',
      surface: isDark ? '#2c2c54' : '#f8f9fa',
      text: isDark ? '#ffffff' : '#000000',
      textSecondary: isDark ? '#cccccc' : '#666666',
      border: isDark ? '#444' : '#e0e0e0',
      success: '#27ae60',
      warning: '#f39c12',
      error: '#e74c3c',
      clash: {
        blue: '#4a90e2',
        purple: '#8e44ad',
        gold: '#f1c40f',
        red: '#e74c3c'
      }
    }
  };

  const value = {
    isDark,
    toggleTheme,
    theme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
