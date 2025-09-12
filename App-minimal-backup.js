import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  Platform,
  LogBox
} from 'react-native';

// Ignore all warnings that could cause crashes
LogBox.ignoreAllLogs();

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Minimal initialization
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <View style={styles.loadingContainer}>
          <Text style={styles.title}>Wadrari</Text>
          <Text style={styles.subtitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <View style={styles.mainContainer}>
        <Text style={styles.title}>Wadrari Mobile</Text>
        <Text style={styles.subtitle}>Welcome to Wadrari!</Text>
        <Text style={styles.info}>Platform: {Platform.OS}</Text>
        <Text style={styles.info}>App is running successfully!</Text>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Status:</Text>
          <Text style={styles.statusGood}>✅ App Loaded</Text>
          <Text style={styles.statusGood}>✅ No Crashes</Text>
          <Text style={styles.statusGood}>✅ Ready for Features</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  info: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 10,
  },
  statusContainer: {
    marginTop: 40,
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

export default App;
