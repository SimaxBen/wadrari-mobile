import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
let getAllQuests = async () => [];

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
  if (supabaseModule.getAllQuests) getAllQuests = supabaseModule.getAllQuests;
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
  const [seasonName, setSeasonName] = useState('Season 1');
  const autoCompleted = useRef(new Set());

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

  // Auto-complete daily quests when target reached (no manual click)
  useEffect(() => {
    (async () => {
      for (const q of quests) {
        if (q.progress >= q.target && !autoCompleted.current.has(q.id)) {
          const res = await completeQuest({ userId: userData?.id, questId: q.id, reward: q.reward });
          if (res?.success) {
            autoCompleted.current.add(q.id);
          }
        }
      }
    })();
  }, [quests, userData?.id]);

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
      <ScrollView style={[styles.mainContainer, { marginBottom: 70 }]}>
        {/* Page header where relevant */}
        {page === 'Leaderboard' && (
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <Text style={styles.title}>🏆 {seasonName}</Text>
          </View>
        )}

        {page === 'Chat' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💬 Groups</Text>
            {!activeChat && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {chats.map((c) => (
                  <TouchableOpacity key={c.id} style={styles.groupCard} onPress={async () => {
                    setActiveChat(c);
                    const list = await getMessagesByChat({ chatId: c.id, limit: 100 });
                    setMessages(Array.isArray(list) ? list : []);
                  }}>
                    <View style={styles.groupAvatar}>
                      {c.image_url ? (
                        <Image source={{ uri: c.image_url }} style={styles.groupAvatarImg} />
                      ) : (
                        <Text style={styles.groupAvatarText}>{(c.name || 'G')[0]}</Text>
                      )}
                    </View>
                    <Text style={styles.groupName}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {!activeChat && (
              <View style={[styles.row, { marginTop: 10 }]}>
                <TextInput style={[styles.input, { flex: 1, marginRight: 10 }]} placeholder="New group name" placeholderTextColor="#888" value={newChatName} onChangeText={setNewChatName} />
                <TouchableOpacity style={styles.loginButton} onPress={handleCreateChat}><Text style={styles.loginButtonText}>Create</Text></TouchableOpacity>
              </View>
            )}
            {activeChat && (
              <View>
                <View style={styles.row}>
                  <TouchableOpacity onPress={() => setActiveChat(null)} style={[styles.pill, { marginBottom: 10 }]}><Text style={styles.pillText}>⬅ Back</Text></TouchableOpacity>
                  <Text style={[styles.sectionTitle, { marginLeft: 10 }]}>{activeChat.name}</Text>
                </View>
                {messages.map((m) => (
                  <Text key={m.id} style={styles.listItem}>
                    <Text style={styles.bold}>{m.username || 'User'}</Text> · {new Date(m.created_at).toLocaleString()}{'\n'}{m.message}
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
          </View>
        )}

        {page === 'Stories' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Stories</Text>
            <TextInput style={[styles.input, { width: '100%' }]} placeholder="Story text" placeholderTextColor="#888" value={storyText} onChangeText={setStoryText} />
            <View style={styles.row}>
              <TouchableOpacity style={[styles.loginButton, { flex: 1, marginRight: 10 }]} onPress={async () => {
                const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (lib.status !== 'granted') { Alert.alert('Permission', 'Gallery required'); return; }
                const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
                if (!result.canceled && result.assets?.[0]?.uri) setStoryImageUri(result.assets[0].uri);
              }}>
                <Text style={styles.loginButtonText}>Pick Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.loginButton, { flex: 1 }]} onPress={async () => {
                const cap = await ImagePicker.requestCameraPermissionsAsync();
                if (cap.status !== 'granted') { Alert.alert('Permission', 'Camera required'); return; }
                const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
                if (!result.canceled && result.assets?.[0]?.uri) setStoryImageUri(result.assets[0].uri);
              }}>
                <Text style={styles.loginButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>
            {!!storyImageUri && <Image source={{ uri: storyImageUri }} style={{ width: '100%', height: 160, borderRadius: 8, marginVertical: 10 }} />}
            <TouchableOpacity style={styles.loginButton} onPress={async () => { await handleAddStory(); await notifyStoryPosted(); }}>
              <Text style={styles.loginButtonText}>Add Story</Text>
            </TouchableOpacity>
            {stories.filter((s) => !s.expires_at || new Date(s.expires_at) > new Date()).map((s) => (
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {leaderboard.map((u, i) => (
                <View key={u.id || i} style={styles.userCard}>
                  <View style={styles.userAvatar}>
                    {u.avatar_url ? <Image source={{ uri: u.avatar_url }} style={styles.userAvatarImg} /> : <Text style={styles.userAvatarText}>{(u.username || 'U')[0]}</Text>}
                  </View>
                  <Text style={styles.bold}>{i + 1}. {u.username || 'Unknown'}</Text>
                  <Text style={{ color: '#ccc' }}>{u.trophies ?? 0}🏆</Text>
                </View>
              ))}
            </View>
          </View>
  )}

        {page === 'Quests' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Quests</Text>
            {/* Show existing quests from DB if available */}
            {/* Lightweight fetch when entering page */}
            {leaderboard && null}
            <TouchableOpacity style={[styles.pill, { alignSelf: 'flex-start', marginBottom: 10 }]} onPress={async () => {
              const list = await getAllQuests({ onlyActive: true });
              Alert.alert('Quests', `Loaded ${Array.isArray(list) ? list.length : 0} quests`);
            }}>
              <Text style={styles.pillText}>Refresh</Text>
            </TouchableOpacity>
            {/* Admin form for SIMAX */}
            {userData?.username === 'SIMAX' && (
              <View>
                <Text style={styles.sectionTitle}>Create Quest</Text>
                <TextInput style={[styles.input, { width: '100%' }]} placeholder="Name" placeholderTextColor="#888" value={newChatName} onChangeText={setNewChatName} />
                <TouchableOpacity style={styles.loginButton} onPress={async () => {
                  const name = (newChatName || '').trim();
                  if (!name) return;
                  try {
                    const res = await (createQuest ? createQuest({ name, description: 'Manual', trophy_reward: 10, quest_type: 'daily', created_by: userData?.id }) : Promise.resolve({ success: false }));
                    if (res?.success) {
                      Alert.alert('Quest', 'Created');
                      setNewChatName('');
                    } else {
                      Alert.alert('Quest', res?.error || 'Failed');
                    }
                  } catch (e) { Alert.alert('Quest', e.message); }
                }}>
                  <Text style={styles.loginButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {page === 'Profile' && (
          <View style={styles.section}>
            {/* Fixed header with avatar and name */}
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <View style={styles.userAvatarLarge}>
                {userData?.avatar_url ? <Image source={{ uri: userData.avatar_url }} style={styles.userAvatarImgLarge} /> : <Text style={styles.userAvatarTextLarge}>{(userData?.username || 'U')[0]}</Text>}
              </View>
              <Text style={[styles.title, { marginBottom: 0 }]}>{userData?.username}</Text>
            </View>
            {/* Stats row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }}>
              <Text style={styles.profileItem}>🏆 {userData?.trophies || 0}</Text>
              <Text style={styles.profileItem}>🌟 {userData?.seasonal_trophies || 0}</Text>
            </View>
            <Text style={styles.sectionTitle}>🎯 Daily Quests</Text>
            {quests.map((q) => (
              <View key={q.id} style={{ marginBottom: 10 }}>
                <Text style={styles.listItem}><Text style={styles.bold}>{q.title}</Text> — {q.description} • {q.progress}/{q.target} (+{q.reward}🏆)</Text>
                {q.progress >= q.target && <Text style={{ color: '#00ff88' }}>Completed</Text>}
              </View>
            ))}
            <TouchableOpacity style={[styles.logoutButton, { alignSelf: 'center' }]} onPress={onLogout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      {/* Bottom tabs */}
      <View style={styles.bottomTabs}>
        {['Chat','Stories','Leaderboard','Quests','Profile'].map((p) => (
          <TouchableOpacity key={p} style={[styles.bottomTab, page === p && styles.bottomTabActive]} onPress={() => setPage(p)}>
            <Text style={[styles.bottomTabText, page === p && styles.bottomTabTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  bottomTabs: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#2a2a4e',
    borderTopWidth: 1,
    borderTopColor: '#3b3b69',
  },
  bottomTab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 },
  bottomTabActive: { backgroundColor: '#4a90e2' },
  bottomTabText: { color: '#cccccc' },
  bottomTabTextActive: { color: '#ffffff', fontWeight: 'bold' },
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
  groupCard: { width: '30%', alignItems: 'center', padding: 10, backgroundColor: '#1f1f3a', borderRadius: 10, marginBottom: 10 },
  groupAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#4a90e2', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  groupAvatarImg: { width: 64, height: 64, borderRadius: 32 },
  groupAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  groupName: { color: '#fff', textAlign: 'center' },
  userCard: { width: '30%', alignItems: 'center', padding: 10, backgroundColor: '#1f1f3a', borderRadius: 10, marginBottom: 10 },
  userAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#4a90e2', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  userAvatarImg: { width: 64, height: 64, borderRadius: 32 },
  userAvatarText: { color: '#fff', fontWeight: 'bold' },
  userAvatarLarge: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#4a90e2', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  userAvatarImgLarge: { width: 96, height: 96, borderRadius: 48 },
  userAvatarTextLarge: { color: '#fff', fontWeight: 'bold', fontSize: 28 },
});

// Export with Error Boundary
export default () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
