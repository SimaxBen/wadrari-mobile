import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  TouchableOpacity,
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView
} from 'react-native';

// Safe import without any console statements
let loginWithUsername = async () => {
  throw new Error('Authentication service unavailable');
};

try {
  const supabaseModule = require('./src/services/supabase');
  if (supabaseModule && supabaseModule.loginWithUsername) {
    loginWithUsername = supabaseModule.loginWithUsername;
  }
} catch (error) {
  // Silent failure
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Silent error handling
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loginContainer}>
            <Text style={styles.title}>⚔️ WADRARI</Text>
            <Text style={styles.subtitle}>Something went wrong</Text>
            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={() => this.setState({ hasError: false })}
            >
              <Text style={styles.loginButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// Login Screen Component
const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await loginWithUsername(username.trim(), password);
      if (result && result.username) {
        onLogin(result);
      } else {
        Alert.alert('Login Failed', 'Invalid username or password');
      }
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.loginContainer}>
        <Text style={styles.title}>⚔️ WADRARI</Text>
        <Text style={styles.subtitle}>Gaming, Chat & Adventures</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.disabledButton]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.demoNote}>
          Use: SIMAX, YassinOss, or OZA
        </Text>
      </View>
    </SafeAreaView>
  );
};

// Main App Screen Component  
const MainScreen = ({ userData, onLogout }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ScrollView style={styles.mainContainer}>
        <Text style={styles.title}>⚔️ WADRARI</Text>
        <Text style={styles.subtitle}>Welcome back, {userData?.username || 'User'}!</Text>
        
        <View style={styles.profileContainer}>
          <Text style={styles.profileTitle}>Profile Information</Text>
          <Text style={styles.profileItem}>ID: {userData?.id || 'N/A'}</Text>
          <Text style={styles.profileItem}>Username: {userData?.username || 'N/A'}</Text>
          <Text style={styles.profileItem}>Display Name: {userData?.display_name || 'N/A'}</Text>
          <Text style={styles.profileItem}>🏆 Trophies: {userData?.trophies || 0}</Text>
          <Text style={styles.profileItem}>🌟 Seasonal: {userData?.seasonal_trophies || 0}</Text>
          <Text style={styles.profileItem}>💬 Messages: {userData?.total_messages || 0}</Text>
          <Text style={styles.profileItem}>📚 Stories: {userData?.total_stories || 0}</Text>
          <Text style={styles.profileItem}>🔥 Streak: {userData?.current_streak || 0}</Text>
          <Text style={styles.profileItem}>🎖️ Badges: {userData?.badges?.length || 0}</Text>
          {userData?.created_at && (
            <Text style={styles.profileItem}>
              Joined: {new Date(userData.created_at).toLocaleDateString()}
            </Text>
          )}
          {userData?.last_activity && (
            <Text style={styles.profileItem}>
              Last Active: {new Date(userData.last_activity).toLocaleDateString()}
            </Text>
          )}
        </View>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Connection Status:</Text>
          <Text style={styles.statusGood}>✅ Supabase Connected</Text>
          <Text style={styles.statusGood}>✅ User Authenticated</Text>
          <Text style={styles.statusGood}>✅ Real Database Data</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Main App Component
const App = () => {
  const [userData, setUserData] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize app safely with timeout
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (loginData) => {
    if (loginData && typeof loginData === 'object') {
      setUserData(loginData);
    }
  };

  const handleLogout = () => {
    setUserData(null);
  };

  if (!isReady) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginContainer}>
          <Text style={styles.title}>⚔️ WADRARI</Text>
          <Text style={styles.subtitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!userData) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <MainScreen userData={userData} onLogout={handleLogout} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mainContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#2a2a4e',
    borderWidth: 1,
    borderColor: '#4a90e2',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#ffffff',
  },
  loginButton: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 30,
    alignSelf: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoNote: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  profileContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#2a2a4e',
    borderRadius: 10,
    width: '100%',
    marginBottom: 20,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 15,
    textAlign: 'center',
  },
  profileItem: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  statusContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#2a2a4e',
    borderRadius: 10,
    width: '100%',
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 15,
    textAlign: 'center',
  },
  statusGood: {
    fontSize: 16,
    color: '#00ff88',
    marginBottom: 8,
    textAlign: 'center',
  },
});

// Export with Error Boundary
export default () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
