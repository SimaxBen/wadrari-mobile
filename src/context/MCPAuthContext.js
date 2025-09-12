// Enhanced MCP Authentication Context for React Native
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import mcpClient from '../services/mcpClient';

const MCPAuthContext = createContext();

export const useMCPAuth = () => {
  const context = useContext(MCPAuthContext);
  if (!context) {
    throw new Error('useMCPAuth must be used within an MCPAuthProvider');
  }
  return context;
};

export const MCPAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state with better error handling
  useEffect(() => {
    // Add a delay to ensure app is fully loaded
    const timer = setTimeout(() => {
      initializeAuth();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔧 Initializing authentication...');
      setLoading(true);
      setError(null);
      
      // Test if secure store is working
      try {
        await SecureStore.setItemAsync('test', 'test');
        await SecureStore.deleteItemAsync('test');
        console.log('✅ Secure Store is working');
      } catch (storeError) {
        console.error('❌ Secure Store error:', storeError);
        throw new Error('Storage not available');
      }
      
      // Simplified connection test with timeout
      try {
        const connectionPromise = mcpClient.testConnection();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        );
        
        await Promise.race([connectionPromise, timeoutPromise]);
        console.log('✅ Backend connection successful');
      } catch (connError) {
        console.warn('⚠️ Backend connection failed:', connError.message);
        // Continue without connection - might work offline
      }
      
      // Check for stored auth token
      const storedUser = await SecureStore.getItemAsync('user');
      console.log('📱 Stored user:', storedUser ? 'Found' : 'None');
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('👤 Loading user:', userData.email || 'Unknown');
          setUser(userData);
          
          // Load profile with timeout
          if (userData.id) {
            loadUserProfile(userData.id).catch(error => {
              console.warn('⚠️ Profile loading failed:', error.message);
            });
          }
        } catch (parseError) {
          console.error('❌ Error parsing stored user data:', parseError);
          // Clear corrupted data
          await SecureStore.deleteItemAsync('user').catch(() => {});
        }
      } else {
        console.log('🔍 No stored user found');
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      setError(error.message);
      
      // Show user-friendly error only for critical issues
      if (error.message.includes('Storage not available')) {
        Alert.alert(
          'App Error', 
          'Unable to access device storage. Please restart the app.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
      console.log('✅ Auth initialization complete');
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      console.log('📊 Loading user profile...');
      
      const result = await mcpClient.callTool('getUserProfile', { userId });
      if (result.success && result.data) {
        setProfile(result.data);
        console.log('✅ Profile loaded successfully');
      } else {
        console.warn('⚠️ Profile loading failed:', result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Profile loading error:', error);
      // Don't crash the app if profile loading fails
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      setLoading(true);
      setError(null);
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      const result = await mcpClient.callTool('loginUser', { 
        email: email.toLowerCase().trim(), 
        password 
      });
      
      console.log('📡 Login result:', result.success ? 'Success' : 'Failed');
      
      if (result.success && result.data) {
        const userData = result.data;
        console.log('👤 User logged in:', userData.email || 'Unknown');
        
        // Store user data securely
        await SecureStore.setItemAsync('user', JSON.stringify(userData));
        setUser(userData);
        
        // Load profile
        if (userData.id) {
          loadUserProfile(userData.id).catch(console.error);
        }
        
        return { success: true, data: userData };
      } else {
        const errorMessage = result.error || 'Login failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, username) => {
    try {
      console.log('📝 Attempting registration for:', email);
      setLoading(true);
      setError(null);
      
      if (!email || !password || !username) {
        throw new Error('All fields are required');
      }
      
      const result = await mcpClient.callTool('registerUser', {
        email: email.toLowerCase().trim(),
        password,
        username: username.trim()
      });
      
      console.log('📡 Registration result:', result.success ? 'Success' : 'Failed');
      
      if (result.success && result.data) {
        const userData = result.data;
        console.log('👤 User registered:', userData.email || 'Unknown');
        
        // Store user data securely  
        await SecureStore.setItemAsync('user', JSON.stringify(userData));
        setUser(userData);
        
        // Load profile
        if (userData.id) {
          loadUserProfile(userData.id).catch(console.error);
        }
        
        return { success: true, data: userData };
      } else {
        const errorMessage = result.error || 'Registration failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      const errorMessage = error.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out user');
      setLoading(true);
      
      // Clear stored data
      await SecureStore.deleteItemAsync('user').catch(() => {});
      
      // Clear state
      setUser(null);
      setProfile(null);
      setError(null);
      
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if logout fails, clear the state
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced error recovery
  const clearError = () => {
    setError(null);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadUserProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    refreshProfile,
    isAuthenticated: !!user
  };

  return (
    <MCPAuthContext.Provider value={value}>
      {children}
    </MCPAuthContext.Provider>
  );
};
