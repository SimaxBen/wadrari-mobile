import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert, ScrollView, Image } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { configureNotifications, notifyNewMessage, notifyStoryPosted } from './src/services/notifications';

// Safe import without any console statements
let loginWithUsername = async () => { throw new Error('Authentication service unavailable'); };
let getMessages = async () => [];
let getMessagesByChat = async () => [];
let sendMessage = async () => ({ success: false });
let subscribeToMessages = () => () => {};
let getStories = async () => [];
let addStory = async () => ({ success: false });
let uploadImage = async () => ({ success: false });
let getLeaderboard = async () => [];
let getQuestsForUser = async () => [];
let completeQuest = async () => ({ success: false });
let getChats = async () => [];
let createChat = async () => ({ success: false });

try {
  const supabaseModule = require('./src/services/supabase');
  if (supabaseModule) {
    if (supabaseModule.loginWithUsername) loginWithUsername = supabaseModule.loginWithUsername;
  if (supabaseModule.getMessages) getMessages = supabaseModule.getMessages;
  if (supabaseModule.getMessagesByChat) getMessagesByChat = supabaseModule.getMessagesByChat;
    if (supabaseModule.sendMessage) sendMessage = supabaseModule.sendMessage;
    if (supabaseModule.subscribeToMessages) subscribeToMessages = supabaseModule.subscribeToMessages;
    if (supabaseModule.getStories) getStories = supabaseModule.getStories;
  if (supabaseModule.addStory) addStory = supabaseModule.addStory;
  if (supabaseModule.uploadImage) uploadImage = supabaseModule.uploadImage;
    if (supabaseModule.getLeaderboard) getLeaderboard = supabaseModule.getLeaderboard;
    if (supabaseModule.getQuestsForUser) getQuestsForUser = supabaseModule.getQuestsForUser;
  if (supabaseModule.completeQuest) completeQuest = supabaseModule.completeQuest;
  if (supabaseModule.getChats) getChats = supabaseModule.getChats;
  if (supabaseModule.createChat) createChat = supabaseModule.createChat;
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
  const [page, setPage] = useState('Chat'); // Chat | Stories | Leaderboard | Quests | Profile
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [stories, setStories] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [quests, setQuests] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [newChatName, setNewChatName] = useState('');
  const [storyText, setStoryText] = useState('');
  const [storyImageUri, setStoryImageUri] = useState('');

  useEffect(() => {
    let unsubscribe = null;
    const load = async () => {
      try {
        const [ch, msgs, sts, lb, qs] = await Promise.all([
          getChats({ includePublic: true }),
          getMessages({ limit: 50 }),
          getStories({ limit: 20 }),
          getLeaderboard({ limit: 20 }),
          getQuestsForUser(userData?.id)
        ]);
        setChats(Array.isArray(ch) ? ch : []);
        setMessages(Array.isArray(msgs) ? msgs : []);
        setStories(Array.isArray(sts) ? sts : []);
        setLeaderboard(Array.isArray(lb) ? lb : []);
        setQuests(Array.isArray(qs) ? qs : []);
        // Default to first chat (e.g., General)
        if (!activeChat && Array.isArray(ch) && ch.length > 0) setActiveChat(ch[0]);
      } catch (_) {}
      try {
        unsubscribe = subscribeToMessages((msg) => {
          if (!msg) return;
          setMessages((prev) => [...prev, msg]);
        });
      } catch (_) {}
    };
    load();
    return () => {
      try { if (typeof unsubscribe === 'function') unsubscribe(); } catch (_) {}
    };
  }, [userData?.id]);

  const handleSend = async () => {
    const text = (newMessage || '').trim();
    if (!text) return;
    setNewMessage('');
    const optimistic = {
      id: `tmp_${Date.now()}`,
      message: text,
      user_id: userData?.id,
      username: userData?.username,
      created_at: new Date().toISOString(),
      profiles: { username: userData?.username }
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await sendMessage({ userId: userData?.id, content: text, chatId: activeChat?.id || null });
      if (!res?.success || !res?.data) {
        // rollback optimistic add on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      } else {
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? res.data : m)));
      }
    } catch (_) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  };

  const handleCreateChat = async () => {
    const name = (newChatName || '').trim();
    if (!name) return;
    const res = await createChat({ name, type: 'group', created_by: userData?.id });
    if (res?.success && res.data) {
      setChats((prev) => [...prev, res.data]);
      setActiveChat(res.data);
      setNewChatName('');
    }
  };

  const handleAddStory = async () => {
    try {
      let mediaUrl = null;
      if (storyImageUri) {
        const upload = await uploadImage({ bucket: 'story-images', fileUri: storyImageUri, pathPrefix: `${userData?.id}/` });
        if (!upload?.success) {
          Alert.alert('Upload failed', upload?.error || '');
          return;
        }
        mediaUrl = upload.url;
      }
      const res = await addStory({ userId: userData?.id, content: storyText, mediaUrl });
      if (res?.success && res.data) {
        setStories((prev) => [res.data, ...prev]);
        setStoryText('');
        setStoryImageUri('');
      } else if (res?.error) {
        Alert.alert('Story failed', res.error);
      }
    } catch (e) {
      Alert.alert('Story failed', e.message);
    }
  };

  const handleCompleteQuest = async (q) => {
    const res = await completeQuest({ userId: userData?.id, questId: q.id, reward: q.reward });
    if (res?.success) {
      Alert.alert('Quest', 'Completed! Trophies awarded.');
      setQuests((prev) => prev.map((item) => item.id === q.id ? { ...item, progress: item.target } : item));
    } else if (res?.error) {
      Alert.alert('Quest', res.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ScrollView style={styles.mainContainer}>
        <Text style={styles.title}>⚔️ WADRARI</Text>
        <Text style={styles.subtitle}>Welcome back, {userData?.username || 'User'}!</Text>

        {/* Simple top tabs */}
        <View style={styles.tabs}>
          {['Chat','Stories','Leaderboard','Quests','Profile'].map((p) => (
            <TouchableOpacity key={p} style={[styles.tab, page === p && styles.tabActive]} onPress={() => setPage(p)}>
              <Text style={[styles.tabText, page === p && styles.tabTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Profile summary */}
        <View style={styles.profileContainer}>
          <Text style={styles.profileTitle}>Profile Information</Text>
          <Text style={styles.profileItem}>ID: {userData?.id || 'N/A'}</Text>
          <Text style={styles.profileItem}>Username: {userData?.username || 'N/A'}</Text>
          <Text style={styles.profileItem}>Display Name: {userData?.display_name || 'N/A'}</Text>
          <Text style={styles.profileItem}>🏆 Trophies: {userData?.trophies || 0}</Text>
          <Text style={styles.profileItem}>🌟 Seasonal: {userData?.seasonal_trophies || 0}</Text>
          <Text style={styles.profileItem}>💬 Messages: {userData?.total_messages || 0}</Text>
          <Text style={styles.profileItem}>📚 Stories: {userData?.total_stories || 0}</Text>
        </View>

        {page === 'Chat' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💬 Chats</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {chats.map((c) => (
                <TouchableOpacity key={c.id} style={[styles.pill, activeChat?.id === c.id && styles.pillActive]} onPress={async () => {
                  setActiveChat(c);
                  const list = await getMessagesByChat({ chatId: c.id, limit: 100 });
                  setMessages(Array.isArray(list) ? list : []);
                }}>
                  <Text style={[styles.pillText, activeChat?.id === c.id && styles.pillTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 10 }]} placeholder="New group name" placeholderTextColor="#888" value={newChatName} onChangeText={setNewChatName} />
              <TouchableOpacity style={styles.loginButton} onPress={handleCreateChat}><Text style={styles.loginButtonText}>Create</Text></TouchableOpacity>
            </View>
            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Messages</Text>
            {messages.map((m) => (
              <Text key={m.id} style={styles.listItem}>
                <Text style={styles.bold}>{m.username || 'User'}:</Text> {m.message}
              </Text>
            ))}
            <View style={styles.row}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 10 }]} placeholder="Type a message" placeholderTextColor="#888" value={newMessage} onChangeText={setNewMessage} />
              <TouchableOpacity style={styles.loginButton} onPress={async () => { await handleSend(); await notifyNewMessage(userData?.username, newMessage); }}>
                <Text style={styles.loginButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {page === 'Stories' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Stories</Text>
            <TextInput style={[styles.input, { width: '100%' }]} placeholder="Story text" placeholderTextColor="#888" value={storyText} onChangeText={setStoryText} />
            <TextInput style={[styles.input, { width: '100%' }]} placeholder="Image URI (optional)" placeholderTextColor="#888" value={storyImageUri} onChangeText={setStoryImageUri} />
            {!!storyImageUri && <Image source={{ uri: storyImageUri }} style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 10 }} />}
            <TouchableOpacity style={styles.loginButton} onPress={async () => { await handleAddStory(); await notifyStoryPosted(); }}>
              <Text style={styles.loginButtonText}>Add Story</Text>
            </TouchableOpacity>
            {stories.map((s) => (
              <View key={s.id} style={{ marginTop: 10 }}>
                <Text style={styles.listItem}><Text style={styles.bold}>{s.author}</Text> — {s.content || ''}</Text>
                {s.media_url ? <Image source={{ uri: s.media_url }} style={{ width: '100%', height: 200, borderRadius: 8 }} /> : null}
              </View>
            ))}
          </View>
        )}

        {page === 'Leaderboard' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏅 Leaderboard</Text>
            {leaderboard.map((u, i) => (
              <Text key={u.id || i} style={styles.listItem}>
                {i + 1}. <Text style={styles.bold}>{u.username || 'Unknown'}</Text> — {u.trophies ?? 0}🏆 • Season: {u.seasonal_trophies ?? 0}
              </Text>
            ))}
            <Text style={{ color: '#cccccc', marginTop: 10 }}>
              Current season shown. At season reset, trophies carry 60% to seasonal.
            </Text>
          </View>
  )}

        {page === 'Quests' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛠️ Admin Quests (SIMAX)</Text>
            <Text style={{ color: '#cccccc', marginBottom: 8 }}>Create quests with type: lifetime, daily, or unlimited</Text>
            {/* Minimal admin form would go here; keeping UI light to avoid clutter. */}
            <Text style={{ color: '#888' }}>Ask me to enable in-app form, or grant INSERT RLS for SIMAX only.</Text>
          </View>
        )}

        {page === 'Profile' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Daily Quests</Text>
            {quests.map((q) => (
              <View key={q.id} style={{ marginBottom: 10 }}>
                <Text style={styles.listItem}><Text style={styles.bold}>{q.title}</Text> — {q.description} • {q.progress}/{q.target} (+{q.reward}🏆)</Text>
                <TouchableOpacity disabled={q.progress >= q.target} style={[styles.loginButton, q.progress >= q.target && { opacity: 0.6 }]} onPress={() => handleCompleteQuest(q)}>
                  <Text style={styles.loginButtonText}>{q.progress >= q.target ? 'Completed' : 'Complete'}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

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

    // Load persisted user
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.id) setUserData(parsed);
        }
      } catch {}
    })();

    // Configure notifications
    (async () => { await configureNotifications(); })();

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (loginData) => {
    if (loginData && typeof loginData === 'object') {
      setUserData(loginData);
  // persist
  try { SecureStore.setItemAsync('user', JSON.stringify(loginData)); } catch {}
    }
  };

  const handleLogout = () => {
    setUserData(null);
  try { SecureStore.deleteItemAsync('user'); } catch {}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
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
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2a2a4e',
  },
  tabActive: {
    backgroundColor: '#4a90e2',
  },
  tabText: { color: '#cccccc' },
  tabTextActive: { color: '#ffffff', fontWeight: 'bold' },
  section: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#2a2a4e',
    borderRadius: 10,
    width: '100%',
  },
  pill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#2a2a4e', marginRight: 8 },
  pillActive: { backgroundColor: '#4a90e2' },
  pillText: { color: '#cccccc' },
  pillTextActive: { color: '#ffffff', fontWeight: 'bold' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 10,
  },
  listItem: {
    fontSize: 15,
    color: '#cccccc',
    marginBottom: 8,
  },
  bold: { fontWeight: 'bold', color: '#ffffff' },
});

// Export with Error Boundary
export default () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
