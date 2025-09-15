import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './src/context/ThemeContext';
import { MCPAuthProvider } from './src/context/MCPAuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { requestNotificationPermissions } from './src/services/notifications';

export default function App() {
  useEffect(() => {
    // Fire and forget permission request on boot
    requestNotificationPermissions();
  }, []);
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
