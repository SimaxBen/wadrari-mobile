import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMCPAuth } from '../context/MCPAuthContext';
import { ActivityIndicator, View, Text } from 'react-native';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ChatScreen from '../screens/ChatScreen';
import StoriesScreen from '../screens/StoriesScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import QuestsScreen from '../screens/QuestsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Loading Component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
    <Text style={{ color: '#4a90e2', fontSize: 18 }}>Loading...</Text>
    <Text style={{ color: 'white', marginTop: 10 }}>Please wait...</Text>
  </View>
);

// Auth Stack (Login/Register)
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Main Tab Navigator
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#1a1a2e',
        borderTopColor: '#4a90e2',
      },
      tabBarActiveTintColor: '#4a90e2',
      tabBarInactiveTintColor: '#gray',
    }}
  >
    <Tab.Screen 
      name="Chat" 
      component={ChatScreen}
      options={{
        tabBarLabel: 'Chat',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>💬</Text>
      }}
    />
    <Tab.Screen 
      name="Stories" 
      component={StoriesScreen}
      options={{
        tabBarLabel: 'Stories',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>📚</Text>
      }}
    />
    <Tab.Screen 
      name="Quests" 
      component={QuestsScreen}
      options={{
        tabBarLabel: 'Quests',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>🎯</Text>
      }}
    />
    <Tab.Screen 
      name="Leaderboard" 
      component={LeaderboardScreen}
      options={{
        tabBarLabel: 'Leaderboard',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>🏆</Text>
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{
        tabBarLabel: 'Profile',
        tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>👤</Text>
      }}
    />
  </Tab.Navigator>
);

// Main App Navigator
const AppNavigator = () => {
  const { user, loading } = useMCPAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
