import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './src/context/ThemeContext';
import { MCPAuthProvider } from './src/context/MCPAuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <MCPAuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </MCPAuthProvider>
    </ThemeProvider>
  );
}
