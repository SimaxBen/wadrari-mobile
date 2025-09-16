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
let getStoryComments = async () => [];
let addStoryComment = async () => ({ success: false });
let likeStory = async () => ({ success: false });
let unlikeStory = async () => ({ success: false });
let getUserLikesForStories = async () => [];
let getStoryReactions = async () => [];
let getUserBadges = async () => [];
let getLeaderboard = async () => [];
let getQuestsForUser = async () => [];
let completeQuest = async () => ({ success: false });
let getChats = async () => [];
let createChat = async () => ({ success: false });
let getAllQuests = async () => [];
let createQuest = async () => ({ success: false });
let updateUserAvatar = async () => ({ success: false });
let updateChatImage = async () => ({ success: false });
let getUserProfile = async () => ({ success: false });

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
    if (supabaseModule.getStoryComments) getStoryComments = supabaseModule.getStoryComments;
    if (supabaseModule.addStoryComment) addStoryComment = supabaseModule.addStoryComment;
    if (supabaseModule.likeStory) likeStory = supabaseModule.likeStory;
    if (supabaseModule.unlikeStory) unlikeStory = supabaseModule.unlikeStory;
  if (supabaseModule.getUserLikesForStories) getUserLikesForStories = supabaseModule.getUserLikesForStories;
  if (supabaseModule.getStoryReactions) getStoryReactions = supabaseModule.getStoryReactions;
    if (supabaseModule.getLeaderboard) getLeaderboard = supabaseModule.getLeaderboard;
    if (supabaseModule.getQuestsForUser) getQuestsForUser = supabaseModule.getQuestsForUser;
  if (supabaseModule.getUserBadges) getUserBadges = supabaseModule.getUserBadges;
  if (supabaseModule.completeQuest) completeQuest = supabaseModule.completeQuest;
  if (supabaseModule.getChats) getChats = supabaseModule.getChats;
  if (supabaseModule.createChat) createChat = supabaseModule.createChat;
  if (supabaseModule.getAllQuests) getAllQuests = supabaseModule.getAllQuests;
    if (supabaseModule.createQuest) createQuest = supabaseModule.createQuest;
  if (supabaseModule.updateUserAvatar) updateUserAvatar = supabaseModule.updateUserAvatar;
  if (supabaseModule.updateChatImage) updateChatImage = supabaseModule.updateChatImage;
  if (supabaseModule.getUserProfile) getUserProfile = supabaseModule.getUserProfile;
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
  const [allQuests, setAllQuests] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [newChatName, setNewChatName] = useState('');
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [updatingChatImage, setUpdatingChatImage] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [storyImageUri, setStoryImageUri] = useState('');
  const [storyImageBase64, setStoryImageBase64] = useState(null);
  const [seasonName, setSeasonName] = useState('Season 1');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(userData?.avatar_url || null);
  const [profile, setProfile] = useState(null);
  const autoCompleted = useRef(new Set());
  const [storyComments, setStoryComments] = useState({}); // storyId -> comments[]
  const [storyLikes, setStoryLikes] = useState({}); // storyId -> like count
  const [myLikedStories, setMyLikedStories] = useState([]); // list of storyIds
  const [newCommentText, setNewCommentText] = useState('');
  const [questForm, setQuestForm] = useState({ name: '', description: '', reward: '10', type: 'daily' });
  const [badges, setBadges] = useState([]);
  const [questImageUri, setQuestImageUri] = useState('');
  const [questImageBase64, setQuestImageBase64] = useState(null);

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
  const storyList = Array.isArray(sts) ? sts : [];
  setStories(storyList);
        setLeaderboard(Array.isArray(lb) ? lb : []);
        setQuests(Array.isArray(qs) ? qs : []);
        // Default to first chat (e.g., General)
        if (!activeChat && Array.isArray(ch) && ch.length > 0) setActiveChat(ch[0]);
      } catch (_) {}
      try {
        unsubscribe = subscribeToMessages((msg) => {
          if (!msg) return;
          // Only append messages for the active chat (or global if no activeChat)
          if (!activeChat || msg.chat_id === activeChat?.id || (!msg.chat_id && !activeChat)) {
            setMessages((prev) => [...prev, msg]);
          }
        });
      } catch (_) {}
      // Prefetch likes for visible stories
      try {
        const ids = (Array.isArray(stories) ? stories : storyList).map(s => s.id).filter(Boolean);
        if (ids.length && userData?.id) {
          const liked = await getUserLikesForStories({ userId: userData.id, storyIds: ids });
          setMyLikedStories(Array.isArray(liked) ? liked : []);
        }
        // Like counts per story
        for (const id of ids) {
          try {
            const reactions = await getStoryReactions({ storyId: id });
            const count = (reactions || []).filter(r => r.reaction_type === 'like').length;
            setStoryLikes((prev) => ({ ...prev, [id]: count }));
          } catch {}
        }
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

  // Auto-load available quests when entering the Quests tab
  useEffect(() => {
    (async () => {
      if (page === 'Quests' && typeof getAllQuests === 'function') {
        try {
          const list = await getAllQuests({ onlyActive: true });
          setAllQuests(Array.isArray(list) ? list : []);
        } catch (_) {}
      }
      if (page === 'Profile' && userData?.id && typeof getUserBadges === 'function') {
        try {
          const b = await getUserBadges({ userId: userData.id });
          setBadges(Array.isArray(b) ? b : []);
        } catch (_) {}
      }
      if (page === 'Profile' && userData?.id && typeof getUserProfile === 'function') {
        try {
          const res = await getUserProfile({ userId: userData.id });
          if (res?.success) setProfile(res.data);
        } catch (_) {}
      }
    })();
  }, [page]);

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
        // Try direct file upload first
        let upload = await uploadImage({ bucket: 'story-images', fileUri: storyImageUri, pathPrefix: `${userData?.id}/` });
        // Fallback: use base64 captured from picker/camera
        if (!upload?.success && storyImageBase64) {
          upload = await uploadImage({ bucket: 'story-images', base64: storyImageBase64, mimeType: 'image/jpeg', pathPrefix: `${userData?.id}/` });
        }
        if (!upload?.success) {
          Alert.alert('Upload failed', upload?.error || '');
          return;
        }
        mediaUrl = upload.url;
      }
      const res = await addStory({ userId: userData?.id, content: storyText, mediaUrl });
      if (res?.success && res.data) {
        setStories((prev) => [{ ...res.data, author: userData?.username || 'Me' }, ...prev]);
        setStoryText('');
        setStoryImageUri('');
        setStoryImageBase64(null);
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

  const toggleLike = async (storyId) => {
    if (!storyId || !userData?.id) return;
    const liked = myLikedStories.includes(storyId);
    if (liked) {
      const res = await unlikeStory({ storyId, userId: userData.id });
      if (res?.success) {
        setMyLikedStories((prev) => prev.filter((id) => id !== storyId));
        setStoryLikes((prev) => ({ ...prev, [storyId]: Math.max(0, (prev[storyId] || 0) - 1) }));
      }
    } else {
      const res = await likeStory({ storyId, userId: userData.id });
      if (res?.success) {
        setMyLikedStories((prev) => [...prev, storyId]);
        setStoryLikes((prev) => ({ ...prev, [storyId]: (prev[storyId] || 0) + 1 }));
      }
    }
  };

  const loadComments = async (storyId) => {
    try {
      const list = await getStoryComments({ storyId });
      setStoryComments((prev) => ({ ...prev, [storyId]: Array.isArray(list) ? list : [] }));
    } catch {}
  };

  const sendComment = async (storyId) => {
    const text = (newCommentText || '').trim();
    if (!text || !userData?.id || !storyId) return;
    const res = await addStoryComment({ storyId, userId: userData.id, content: text });
    if (res?.success && res.data) {
  const enriched = { ...res.data, username: userData?.username || null };
  setStoryComments((prev) => ({ ...prev, [storyId]: [...(prev[storyId] || []), enriched] }));
      setNewCommentText('');
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
            <Text style={{ color: '#ccc' }}>60% carryover enabled</Text>
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
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <View style={[styles.row, { flex: 1 }]}>
                    <TouchableOpacity onPress={() => setActiveChat(null)} style={[styles.pill, { marginBottom: 10 }]}><Text style={styles.pillText}>⬅ Back</Text></TouchableOpacity>
                    <Text style={[styles.sectionTitle, { marginLeft: 10 }]}>{activeChat.name}</Text>
                  </View>
                  <TouchableOpacity disabled={updatingChatImage} style={[styles.pill, { marginBottom: 10 }]} onPress={async () => {
                    try {
                      const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (lib.status !== 'granted') { Alert.alert('Permission', 'Gallery required'); return; }
                      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true });
                      const asset = (!result.canceled && result.assets?.[0]) ? result.assets[0] : null;
                      if (!asset) return;
                      setUpdatingChatImage(true);
                      let uploaded = await uploadImage({ bucket: 'group-images', fileUri: asset.uri, pathPrefix: `${activeChat.id}/` });
                      if (!uploaded?.success && asset.base64) {
                        uploaded = await uploadImage({ bucket: 'group-images', base64: asset.base64, mimeType: 'image/jpeg', pathPrefix: `${activeChat.id}/` });
                      }
                      if (uploaded?.success) {
                        await updateChatImage({ chatId: activeChat.id, imageUrl: uploaded.url });
                        setChats((prev) => prev.map((x) => x.id === activeChat.id ? { ...x, image_url: uploaded.url } : x));
                        setActiveChat((prev) => prev ? { ...prev, image_url: uploaded.url } : prev);
                        Alert.alert('Group', 'Image updated.');
                      } else {
                        Alert.alert('Group', uploaded?.error || 'Upload failed');
                      }
                    } catch (e) {
                    } finally { setUpdatingChatImage(false); }
                  }}>
                    <Text style={styles.pillText}>{updatingChatImage ? 'Updating…' : 'Change Photo'}</Text>
                  </TouchableOpacity>
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
                const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true });
                if (!result.canceled && result.assets?.[0]?.uri) {
                  setStoryImageUri(result.assets[0].uri);
                  setStoryImageBase64(result.assets[0].base64 || null);
                }
              }}>
                <Text style={styles.loginButtonText}>Pick Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.loginButton, { flex: 1 }]} onPress={async () => {
                const cap = await ImagePicker.requestCameraPermissionsAsync();
                if (cap.status !== 'granted') { Alert.alert('Permission', 'Camera required'); return; }
                const result = await ImagePicker.launchCameraAsync({ quality: 0.8, base64: true });
                if (!result.canceled && result.assets?.[0]?.uri) {
                  setStoryImageUri(result.assets[0].uri);
                  setStoryImageBase64(result.assets[0].base64 || null);
                }
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
                <View style={[styles.row, { marginTop: 6, justifyContent: 'space-between' }]}>
                  <TouchableOpacity onPress={() => toggleLike(s.id)} style={[styles.pill, myLikedStories.includes(s.id) && styles.pillActive]}>
                    <Text style={[styles.pillText, myLikedStories.includes(s.id) && styles.pillTextActive]}>{myLikedStories.includes(s.id) ? '♥ Liked' : '♡ Like'}{typeof storyLikes[s.id] === 'number' ? ` (${storyLikes[s.id]})` : ''}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => loadComments(s.id)} style={styles.pill}>
                    <Text style={styles.pillText}>💬 Comments</Text>
                  </TouchableOpacity>
                </View>
        {(storyComments[s.id] || []).map((c) => (
                  <Text key={c.id} style={[styles.listItem, { marginLeft: 10 }]}>
          <Text style={styles.bold}>{c.username || c.user_id?.slice(0, 4) || 'User'}</Text>: {c.content}
                  </Text>
                ))}
                <View style={styles.row}>
                  <TextInput style={[styles.input, { flex: 1, marginRight: 10 }]} placeholder="Add a comment" placeholderTextColor="#888" value={newCommentText} onChangeText={setNewCommentText} />
                  <TouchableOpacity style={styles.loginButton} onPress={() => sendComment(s.id)}>
                    <Text style={styles.loginButtonText}>Post</Text>
                  </TouchableOpacity>
                </View>
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
            <View style={{ marginBottom: 10 }}>
              <TouchableOpacity style={[styles.pill, { alignSelf: 'flex-start', marginBottom: 10 }]} onPress={async () => {
                const list = await getAllQuests({ onlyActive: true });
                setAllQuests(Array.isArray(list) ? list : []);
              }}>
                <Text style={styles.pillText}>Refresh</Text>
              </TouchableOpacity>
              {allQuests.map((q) => (
                <View key={q.id} style={{ marginBottom: 8 }}>
                  <Text style={styles.listItem}><Text style={styles.bold}>{q.name}</Text> — {q.description || ''} (+{q.trophy_reward || 0}🏆)</Text>
                  {q.image_url ? (
                    <Image source={{ uri: q.image_url }} style={{ width: '100%', height: 160, borderRadius: 8, marginTop: 6 }} />
                  ) : null}
                </View>
              ))}
            </View>
            {/* Admin form for SIMAX */}
            {userData?.username === 'SIMAX' && (
              <View>
                <Text style={styles.sectionTitle}>Create Quest</Text>
                <TextInput style={[styles.input, { width: '100%' }]} placeholder="Name" placeholderTextColor="#888" value={questForm.name} onChangeText={(t) => setQuestForm({ ...questForm, name: t })} />
                <TextInput style={[styles.input, { width: '100%' }]} placeholder="Description" placeholderTextColor="#888" value={questForm.description} onChangeText={(t) => setQuestForm({ ...questForm, description: t })} />
                <View style={styles.row}>
                  <TouchableOpacity style={[styles.loginButton, { flex: 1 }]} onPress={async () => {
                    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (lib.status !== 'granted') { Alert.alert('Permission', 'Gallery required'); return; }
                    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true });
                    const asset = (!result.canceled && result.assets?.[0]) ? result.assets[0] : null;
                    if (asset) { setQuestImageUri(asset.uri); setQuestImageBase64(asset.base64 || null); }
                  }}>
                    <Text style={styles.loginButtonText}>Pick Quest Image</Text>
                  </TouchableOpacity>
                </View>
                {!!questImageUri && <Image source={{ uri: questImageUri }} style={{ width: '100%', height: 140, borderRadius: 8, marginVertical: 10 }} />}
                <View style={[styles.row, { marginBottom: 10 }]}> 
                  {['daily','weekly','one_time'].map((t) => (
                    <TouchableOpacity key={t} style={[styles.pill, (questForm.type===t) && styles.pillActive]} onPress={() => setQuestForm({ ...questForm, type: t })}>
                      <Text style={[styles.pillText, (questForm.type===t) && styles.pillTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput style={[styles.input, { width: '100%' }]} placeholder="Reward (trophies)" placeholderTextColor="#888" keyboardType="numeric" value={questForm.reward} onChangeText={(t) => setQuestForm({ ...questForm, reward: t })} />
                <TouchableOpacity style={styles.loginButton} onPress={async () => {
                  const name = (questForm.name || '').trim();
                  if (!name) return; const reward = parseInt(questForm.reward || '0', 10) || 0;
                  try {
                    let imageUrl = null;
                    if (questImageUri) {
                      let uploaded = await uploadImage({ bucket: 'quest-images', fileUri: questImageUri, pathPrefix: `quests/${userData?.id || 'admin'}/` });
                      if (!uploaded?.success && questImageBase64) {
                        uploaded = await uploadImage({ bucket: 'quest-images', base64: questImageBase64, mimeType: 'image/jpeg', pathPrefix: `quests/${userData?.id || 'admin'}/` });
                      }
                      if (uploaded?.success) imageUrl = uploaded.url; else { Alert.alert('Quest', uploaded?.error || 'Image upload failed'); return; }
                    }
                    const res = await (createQuest ? createQuest({ name, description: questForm.description || null, image_url: imageUrl, trophy_reward: reward, quest_type: questForm.type || 'daily', created_by: userData?.id }) : Promise.resolve({ success: false }));
                    if (res?.success) {
                      Alert.alert('Quest', 'Created');
                      setQuestForm({ name: '', description: '', reward: '10', type: 'daily' });
                      setQuestImageUri('');
                      setQuestImageBase64(null);
                      try {
                        const list = await getAllQuests({ onlyActive: true });
                        setAllQuests(Array.isArray(list) ? list : []);
                      } catch (_) {}
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
                {(profile?.avatar_url || profileAvatarUrl || userData?.avatar_url) ? (
                  <Image source={{ uri: profileAvatarUrl || profile?.avatar_url || userData.avatar_url }} style={styles.userAvatarImgLarge} />
                ) : (
                  <Text style={styles.userAvatarTextLarge}>{(userData?.username || 'U')[0]}</Text>
                )}
              </View>
              <Text style={[styles.title, { marginBottom: 0 }]}>{profile?.username || userData?.username}</Text>
            </View>
            {/* Stats row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }}>
              <Text style={styles.profileItem}>🏆 {profile?.trophies ?? userData?.trophies ?? 0}</Text>
              <Text style={styles.profileItem}>🌟 {profile?.seasonal_trophies ?? userData?.seasonal_trophies ?? 0}</Text>
              <Text style={styles.profileItem}>🔥 {profile?.current_streak ?? userData?.current_streak ?? 0}d</Text>
            </View>
            <Text style={styles.sectionTitle}>🎯 Daily Quests</Text>
            {quests.map((q) => (
              <View key={q.id} style={{ marginBottom: 10 }}>
                <Text style={styles.listItem}><Text style={styles.bold}>{q.title}</Text> — {q.description} • {q.progress}/{q.target} (+{q.reward}🏆)</Text>
                {q.progress >= q.target ? (
                  <Text style={{ color: '#00ff88' }}>Completed</Text>
                ) : (
                  <TouchableOpacity style={[styles.pill, { alignSelf: 'flex-start' }]} onPress={() => handleCompleteQuest(q)}>
                    <Text style={styles.pillText}>Complete</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {/* Change avatar */}
            <TouchableOpacity style={[styles.pill, { alignSelf: 'center', marginTop: 6 }]} onPress={async () => {
              try {
                const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (lib.status !== 'granted') { Alert.alert('Permission', 'Gallery required'); return; }
                const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true });
                const asset = (!result.canceled && result.assets?.[0]) ? result.assets[0] : null;
                if (!asset) return;
                setUpdatingAvatar(true);
                let uploaded = await uploadImage({ bucket: 'profile-avatars', fileUri: asset.uri, pathPrefix: `${userData?.id}/` });
                if (!uploaded?.success && asset.base64) {
                  uploaded = await uploadImage({ bucket: 'profile-avatars', base64: asset.base64, mimeType: 'image/jpeg', pathPrefix: `${userData?.id}/` });
                }
                if (uploaded?.success) {
                  const resp = await updateUserAvatar({ userId: userData?.id, avatarUrl: uploaded.url });
                  if (resp?.success) {
                    setProfileAvatarUrl(uploaded.url);
                    setProfile((p) => p ? { ...p, avatar_url: uploaded.url } : p);
                    Alert.alert('Profile', 'Avatar updated.');
                  } else {
                    Alert.alert('Profile', resp?.error || 'Update failed');
                  }
                } else {
                  Alert.alert('Profile', uploaded?.error || 'Upload failed');
                }
              } catch (e) {
              } finally { setUpdatingAvatar(false); }
            }}>
              <Text style={styles.pillText}>Change Avatar</Text>
            </TouchableOpacity>
            {!!badges.length && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.sectionTitle}>🏅 Badges</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {badges.map((b) => (
                    <View key={b.id} style={{ paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#1f1f3a', borderRadius: 16, marginRight: 6, marginBottom: 6 }}>
                      <Text style={{ color: '#fff' }}>{b.badge_name || b.badge_type}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
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
