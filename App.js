import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert, ScrollView, Image, Modal } from 'react-native';
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
  const [page, setPage] = useState('Chat'); // Chat | Stories | Leaderboard | Quests | Profile | CreateQuest | CreateStory | CreateChat
  const [questModal, setQuestModal] = useState({ visible: false, quest: null });
  const [showQuestForm, setShowQuestForm] = useState(false);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
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
  const [groupImageUri, setGroupImageUri] = useState('');
  const [groupImageBase64, setGroupImageBase64] = useState(null);
  const messageScrollRef = useRef(null);
  const [storyViewer, setStoryViewer] = useState(null);

  // Standardized image upload function using group image logic
  const handleImageUpload = async ({ bucket, fileUri, base64, pathPrefix, mimeType = 'image/jpeg' }) => {
    try {
      if (!fileUri && !base64) {
        throw new Error('No image selected');
      }
      
      let upload = await uploadImage({ bucket, fileUri, pathPrefix });
      if (!upload?.success && base64) {
        upload = await uploadImage({ bucket, base64, mimeType, pathPrefix });
      }
      
      console.log(`${bucket} upload response:`, upload);
      
      if (!upload?.success) {
        const error = upload?.error || 'Unknown error. Please check your network and try again.';
        console.error(`${bucket} upload error:`, error);
        throw new Error(error);
      }
      
      return upload.url;
    } catch (error) {
      console.error(`${bucket} upload exception:`, error);
      throw error;
    }
  };

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
        console.log('Daily quest progress:', q);
        if (q.progress >= q.target && !autoCompleted.current.has(q.id)) {
          const res = await completeQuest({ userId: userData?.id, questId: q.id, reward: q.reward });
          console.log('AutoCompleteQuest response:', res);
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
      // Refresh leaderboard when switching to it for real-time updates
      if (page === 'Leaderboard' && typeof getLeaderboard === 'function') {
        const leaderboardData = await getLeaderboard({ limit: 20 });
        setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
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
      console.log('SendMessage response:', res);
      if (!res?.success || !res?.data) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      } else {
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? res.data : m)));
      }
    } catch (e) {
      console.log('SendMessage error:', e);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  };

  const handleCreateChat = async (imageUrl = null) => {
    const name = (newChatName || '').trim();
    if (!name) return;
    const res = await createChat({ name, type: 'group', created_by: userData?.id, image_url: imageUrl });
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
        mediaUrl = await handleImageUpload({
          bucket: 'story-images',
          fileUri: storyImageUri,
          base64: storyImageBase64,
          pathPrefix: `${userData?.id}/`
        });
      }
      const res = await addStory({ userId: userData?.id, content: storyText, mediaUrl });
      console.log('AddStory response:', res);
      if (res?.success && res.data) {
        setStories((prev) => [{ ...res.data, author: userData?.username || 'Me' }, ...prev]);
        setStoryText('');
        setStoryImageUri('');
        setStoryImageBase64(null);
      } else if (res?.error) {
        console.error('Add story error:', res.error);
        Alert.alert('Story failed', res.error ? `Error: ${res.error}` : 'Unknown error.');
      }
    } catch (e) {
      console.error('Add story exception:', e);
      Alert.alert('Upload failed', e.message ? `Exception: ${e.message}` : 'Unknown exception.');
    }
  };

  const handleCompleteQuest = async (q) => {
    setQuestModal({ visible: true, quest: q });
  };

  const confirmCompleteQuest = async () => {
    const q = questModal.quest;
    if (!q) return;
    try {
      const reward = q.reward || q.trophy_reward || 0;
      const res = await completeQuest({ userId: userData?.id, questId: q.id, reward: reward });
      console.log('CompleteQuest response:', res);
      if (res?.success) {
        setQuests((prev) => prev.map((item) => item.id === q.id ? { ...item, progress: item.target } : item));
        setQuestModal({ visible: false, quest: null });
        Alert.alert('Quest Completed', `You earned ${reward} trophies!`);
        
        // Refresh user data and quests for real-time updates
        try {
          const [updatedQuests, updatedLeaderboard] = await Promise.all([
            getQuestsForUser(userData?.id),
            getLeaderboard({ limit: 20 })
          ]);
          setQuests(Array.isArray(updatedQuests) ? updatedQuests : []);
          setLeaderboard(Array.isArray(updatedLeaderboard) ? updatedLeaderboard : []);
        } catch (_) {}
      } else if (res?.error) {
        const msg = /permission|denied|rls|network|fail/i.test(res.error) ? 'Quest completion failed: ' + res.error : res.error;
        setQuestModal({ visible: false, quest: null });
        Alert.alert('Quest', msg);
      }
    } catch (e) {
      setQuestModal({ visible: false, quest: null });
      Alert.alert('Quest', 'Error: ' + e.message);
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
      <ScrollView style={[styles.mainContainer, { marginBottom: page === 'Chat' ? 130 : 70 }]}>
        {/* Page header where relevant */}

        {page === 'Chat' && (
          <View style={styles.section}>
            {!activeChat ? (
              <View>
                {/* WhatsApp-style header */}
                <View style={styles.whatsappHeader}>
                  <Text style={styles.whatsappTitle}>Chats</Text>
                  <TouchableOpacity style={styles.newChatButton} onPress={() => setPage('CreateChat')}>
                    <Text style={styles.newChatButtonText}>➕</Text>
                  </TouchableOpacity>
                </View>
                
                {/* WhatsApp-style chat list */}
                <View style={styles.whatsappChatList}>
                  {chats.map((c) => (
                    <TouchableOpacity key={c.id} style={styles.whatsappChatItem} onPress={async () => {
                      setActiveChat(c);
                      const list = await getMessagesByChat({ chatId: c.id, limit: 100 });
                      setMessages(Array.isArray(list) ? list : []);
                    }}>
                      <View style={styles.whatsappAvatar}>
                        {c.image_url ? (
                          <Image 
                            source={{ uri: c.image_url }} 
                            style={styles.whatsappAvatarImg}
                            onError={(e) => {
                              console.log('Group image load error:', e.nativeEvent.error);
                            }}
                          />
                        ) : (
                          <Text style={styles.whatsappAvatarText}>{(c.name || 'G')[0].toUpperCase()}</Text>
                        )}
                      </View>
                      <View style={styles.whatsappChatInfo}>
                        <View style={styles.whatsappChatHeader}>
                          <Text style={styles.whatsappChatName}>{c.name}</Text>
                          <Text style={styles.whatsappChatTime}>now</Text>
                        </View>
                        <Text style={styles.whatsappLastMessage}>Tap to open chat...</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.whatsappChatView}>
                {/* WhatsApp-style chat header */}
                <View style={styles.whatsappChatViewHeader}>
                  <TouchableOpacity onPress={() => setActiveChat(null)} style={styles.whatsappBackButton}>
                    <Text style={styles.whatsappBackText}>←</Text>
                  </TouchableOpacity>
                  <View style={styles.whatsappChatAvatar}>
                    {activeChat.image_url ? (
                      <Image source={{ uri: activeChat.image_url }} style={styles.whatsappChatAvatarImg} />
                    ) : (
                      <Text style={styles.whatsappChatAvatarText}>{(activeChat.name || 'G')[0].toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={styles.whatsappChatHeaderInfo}>
                    <Text style={styles.whatsappChatHeaderName}>{activeChat.name}</Text>
                    <Text style={styles.whatsappChatHeaderStatus}>online</Text>
                  </View>
                  <TouchableOpacity style={styles.whatsappMenuButton} onPress={() => setShowGroupSettings(true)}>
                    <Text style={styles.whatsappMenuText}>⋮</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Scrollable message area */}
                <ScrollView 
                  style={styles.whatsappMessageArea}
                  ref={messageScrollRef}
                  onContentSizeChange={() => {
                    if (messageScrollRef.current) messageScrollRef.current.scrollToEnd({ animated: true });
                  }}
                >
                  {messages.filter(m => m.chat_id === activeChat.id).map((m) => (
                    <View key={m.id} style={[styles.whatsappMessage, m.sender_id === userData?.id ? styles.whatsappMessageSent : styles.whatsappMessageReceived]}>
                      {m.sender_id !== userData?.id && (
                        <Text style={styles.whatsappMessageSender}>{m.username || 'User'}</Text>
                      )}
                      <Text style={styles.whatsappMessageText}>{m.message}</Text>
                      <Text style={styles.whatsappMessageTime}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {page === 'Stories' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Stories</Text>
            
            {/* Add Story Button */}
            <TouchableOpacity style={styles.addButton} onPress={() => setPage('CreateStory')}>
              <Text style={styles.addButtonText}>➕ Add Story</Text>
            </TouchableOpacity>

            {/* Stories Grid */}
            <View style={styles.storiesGrid}>
              {stories.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>📚 No stories yet</Text>
                  <Text style={styles.emptyStateSubtext}>Be the first to share your adventure!</Text>
                </View>
              ) : (
                stories.filter((s) => !s.expires_at || new Date(s.expires_at) > new Date()).map((s) => (
                  <TouchableOpacity key={s.id} style={styles.storyCard} onPress={() => setStoryViewer(s)}>
                    {s.media_url ? (
                    <Image 
                      source={{ uri: s.media_url }} 
                      style={styles.storyImage}
                      onError={(e) => {
                        console.log('Story image load error for URL:', s.media_url, e.nativeEvent.error);
                      }}
                      onLoad={() => {
                        console.log('Story image loaded successfully:', s.media_url);
                      }}
                    />
                  ) : (
                    <View style={styles.storyPlaceholder}>
                      <Text style={styles.storyPlaceholderText}>📝</Text>
                    </View>
                  )}
                  <View style={styles.storyOverlay}>
                    <Text style={styles.storyAuthor}>{s.author}</Text>
                    <Text style={styles.storyPreview} numberOfLines={2}>{s.content || ''}</Text>
                  </View>
                </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}

        {page === 'Leaderboard' && (
          <View style={styles.section}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.title}>� {seasonName}</Text>
              <Text style={{ color: '#ccc' }}>60% carryover enabled</Text>
            </View>
            
            <Text style={styles.sectionTitle}>🏅 Top Players</Text>
            <View style={styles.leaderboardContainer}>
              {leaderboard.map((u, i) => (
                <View key={u.id || i} style={styles.leaderboardItem}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{i + 1}</Text>
                  </View>
                  <View style={styles.userAvatarLeaderboard}>
                    {u.avatar_url ? (
                      <Image 
                        source={{ uri: u.avatar_url }} 
                        style={styles.userAvatarImgLeaderboard}
                        onError={(e) => {
                          console.log('Leaderboard avatar load error:', e.nativeEvent.error);
                        }}
                      />
                    ) : (
                      <Text style={styles.userAvatarTextLeaderboard}>{(u.username || 'U')[0].toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={styles.leaderboardInfo}>
                    <Text style={styles.leaderboardName}>{u.username || 'Unknown'}</Text>
                    <Text style={styles.leaderboardTrophies}>{u.trophies ?? 0} 🏆</Text>
                  </View>
                  {i === 0 && <Text style={styles.crownEmoji}>👑</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        {page === 'Quests' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Quests & Challenges</Text>
            
            {/* Add Quest Button for Admin */}
            {userData?.username === 'SIMAX' && (
              <TouchableOpacity style={styles.addButton} onPress={() => setPage('CreateQuest')}>
                <Text style={styles.addButtonText}>➕ Add Quest</Text>
              </TouchableOpacity>
            )}

            {/* Available Quests List */}
            <View style={styles.questsListContainer}>
              <View style={styles.questsHeader}>
                <Text style={styles.questsListTitle}>Available Quests</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={async () => {
                  const list = await getAllQuests({ onlyActive: true });
                  setAllQuests(Array.isArray(list) ? list : []);
                }}>
                  <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.questsList}>
                {allQuests.map((q) => {
                  // Determine completion state based on quest_type
                  const userQuest = quests.find(qq => qq.id === q.id);
                  const alreadyCompleted = userQuest ? (userQuest.progress >= userQuest.target) : false;
                  const isRepeatable = q.quest_type === 'repeatable';
                  const canComplete = !alreadyCompleted || isRepeatable;
                  return (
                  <TouchableOpacity key={q.id} style={styles.questCard} onPress={() => { /* future detail modal */ }}>
                    {q.image_url ? (
                      <Image 
                        source={{ uri: q.image_url }} 
                        style={styles.questCardImage}
                        onError={(e) => {
                          console.log('Quest image load error:', e.nativeEvent.error);
                        }}
                      />
                    ) : (
                      <View style={styles.questCardPlaceholder}>
                        <Text style={styles.questCardPlaceholderText}>🎯</Text>
                      </View>
                    )}
                    <View style={styles.questCardContent}>
                      <Text style={styles.questCardTitle}>{q.name}</Text>
                      <Text style={styles.questCardDescription} numberOfLines={2}>{q.description || ''}</Text>
                      <Text style={styles.questTypeTag}>Type: {q.quest_type || 'unknown'}</Text>
                      <View style={styles.questCardFooter}>
                        <Text style={styles.questCardReward}>🏆 {q.trophy_reward || q.reward || 0}</Text>
                        <TouchableOpacity disabled={!canComplete} style={[styles.questCardButton, !canComplete && { opacity:0.4 }]} onPress={async () => {
                          if (!canComplete) return;
                          try {
                            const reward = q.trophy_reward || q.reward || 0;
                            const res = await completeQuest({ userId: userData?.id, questId: q.id, reward });
                            if (res?.success) {
                              // Update quests local state
                              setQuests(prev => {
                                const exists = prev.find(p => p.id === q.id);
                                if (exists) {
                                  return prev.map(p => p.id === q.id ? { ...p, progress: p.target || exists.target, reward: reward } : p);
                                }
                                return [...prev, { id: q.id, progress: (q.target || 1), target: (q.target || 1), reward }];
                              });
                              // Instant trophy update
                              if (reward) {
                                userData.trophies = (userData.trophies || 0) + reward;
                                setLeaderboard(prev => prev.map(l => l.id === userData.id ? { ...l, trophies: (l.trophies||0)+reward } : l));
                              }
                              Alert.alert('Quest', `Completed! +${reward} 🏆`);
                            } else if (res?.error) {
                              Alert.alert('Quest', res.error);
                            }
                          } catch(e){
                            Alert.alert('Quest', e.message);
                          }
                        }}>
                          <Text style={styles.questCardButtonText}>{alreadyCompleted && !isRepeatable ? 'Done' : 'Complete'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                )})}
              </View>
            </View>
          </View>
        )}

        {page === 'CreateQuest' && (
          <View style={styles.fullPageContainer}>
            <View style={styles.fullPageHeader}>
              <TouchableOpacity onPress={() => setPage('Quests')} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.fullPageTitle}>Create New Quest</Text>
            </View>
            
            <ScrollView style={styles.fullPageContent}>
              <TextInput 
                style={[styles.fullPageInput, { marginBottom: 16 }]} 
                placeholder="Quest Name" 
                placeholderTextColor="#888" 
                value={questForm.name} 
                onChangeText={(t) => setQuestForm({ ...questForm, name: t })} 
              />
              <TextInput 
                style={[styles.fullPageInput, { minHeight: 100, marginBottom: 16 }]} 
                placeholder="Quest Description" 
                placeholderTextColor="#888" 
                value={questForm.description} 
                onChangeText={(t) => setQuestForm({ ...questForm, description: t })} 
                multiline 
              />
              <TouchableOpacity style={[styles.fullPageButton, { marginBottom: 16 }]} onPress={async () => {
                const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (lib.status !== 'granted') { Alert.alert('Permission', 'Gallery required'); return; }
                const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true });
                const asset = (!result.canceled && result.assets?.[0]) ? result.assets[0] : null;
                if (asset) { setQuestImageUri(asset.uri); setQuestImageBase64(asset.base64 || null); }
              }}>
                <Text style={styles.fullPageButtonText}>📷 Add Image</Text>
              </TouchableOpacity>
              {!!questImageUri && <Image source={{ uri: questImageUri }} style={[styles.fullPagePreviewImage, { marginBottom: 16 }]} />}
              <View style={[styles.row, { marginBottom: 16, justifyContent: 'space-around' }]}> 
                {['daily','repeatable','one_time'].map((t) => (
                  <TouchableOpacity key={t} style={[styles.typeButton, (questForm.type===t) && styles.typeButtonActive]} onPress={() => setQuestForm({ ...questForm, type: t })}>
                    <Text style={[styles.typeButtonText, (questForm.type===t) && styles.typeButtonTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput 
                style={[styles.fullPageInput, { marginBottom: 24 }]} 
                placeholder="Trophy Reward" 
                placeholderTextColor="#888" 
                keyboardType="numeric" 
                value={questForm.reward} 
                onChangeText={(t) => setQuestForm({ ...questForm, reward: t })} 
              />
              <TouchableOpacity style={styles.fullPageSubmitButton} onPress={async () => {
                const name = (questForm.name || '').trim();
                if (!name) { Alert.alert('Error', 'Please enter a quest name'); return; }
                const reward = parseInt(questForm.reward || '0', 10) || 0;
                try {
                  let imageUrl = null;
                  if (questImageUri) {
                    imageUrl = await handleImageUpload({
                      bucket: 'quest-images',
                      fileUri: questImageUri,
                      base64: questImageBase64,
                      pathPrefix: `quests/${userData?.id || 'admin'}/`
                    });
                  }
                  const res = await (createQuest ? createQuest({ name, description: questForm.description || null, image_url: imageUrl, trophy_reward: reward, quest_type: questForm.type || 'daily', created_by: userData?.id }) : Promise.resolve({ success: false }));
                  if (res?.success) {
                    Alert.alert('Success', 'Quest created successfully!');
                    setQuestForm({ name: '', description: '', reward: '10', type: 'daily' });
                    setQuestImageUri('');
                    setQuestImageBase64(null);
                    setPage('Quests');
                    try {
                      const list = await getAllQuests({ onlyActive: true });
                      setAllQuests(Array.isArray(list) ? list : []);
                    } catch (_) {}
                  } else {
                    console.error('Create quest error:', res?.error);
                    Alert.alert('Error', res?.error ? `Error: ${res.error}` : 'Failed to create quest');
                  }
                } catch (e) {
                  console.error('Create quest exception:', e);
                  Alert.alert('Error', e.message ? `Exception: ${e.message}` : 'Unknown error occurred');
                }
              }}>
                <Text style={styles.fullPageSubmitButtonText}>🚀 Create Quest</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {page === 'CreateStory' && (
          <View style={styles.fullPageContainer}>
            <View style={styles.fullPageHeader}>
              <TouchableOpacity onPress={() => setPage('Stories')} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.fullPageTitle}>Create New Story</Text>
            </View>
            
            <ScrollView style={styles.fullPageContent}>
              <TextInput 
                style={[styles.fullPageInput, { minHeight: 120, marginBottom: 16 }]} 
                placeholder="What's your story today?" 
                placeholderTextColor="#888" 
                value={storyText} 
                onChangeText={setStoryText} 
                multiline 
              />
              <View style={[styles.row, { marginBottom: 16 }]}>
                <TouchableOpacity style={[styles.fullPageButton, { flex: 1, marginRight: 8 }]} onPress={async () => {
                  const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (lib.status !== 'granted') { Alert.alert('Permission', 'Gallery required'); return; }
                  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true });
                  if (!result.canceled && result.assets?.[0]?.uri) {
                    setStoryImageUri(result.assets[0].uri);
                    setStoryImageBase64(result.assets[0].base64 || null);
                  }
                }}>
                  <Text style={styles.fullPageButtonText}>📷 Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.fullPageButton, { flex: 1, marginLeft: 8 }]} onPress={async () => {
                  const cap = await ImagePicker.requestCameraPermissionsAsync();
                  if (cap.status !== 'granted') { Alert.alert('Permission', 'Camera required'); return; }
                  const result = await ImagePicker.launchCameraAsync({ quality: 0.8, base64: true });
                  if (!result.canceled && result.assets?.[0]?.uri) {
                    setStoryImageUri(result.assets[0].uri);
                    setStoryImageBase64(result.assets[0].base64 || null);
                  }
                }}>
                  <Text style={styles.fullPageButtonText}>📸 Camera</Text>
                </TouchableOpacity>
              </View>
              {!!storyImageUri && <Image source={{ uri: storyImageUri }} style={[styles.fullPagePreviewImage, { marginBottom: 16 }]} />}
              <TouchableOpacity style={styles.fullPageSubmitButton} onPress={async () => {
                if (!storyText.trim()) { Alert.alert('Error', 'Please enter story text'); return; }
                await handleAddStory();
                await notifyStoryPosted();
                setPage('Stories');
              }}>
                <Text style={styles.fullPageSubmitButtonText}>✨ Publish Story</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {page === 'CreateChat' && (
          <View style={styles.fullPageContainer}>
            <View style={styles.fullPageHeader}>
              <TouchableOpacity onPress={() => setPage('Chat')} style={styles.backButton}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.fullPageTitle}>Create New Group</Text>
            </View>
            
            <ScrollView style={styles.fullPageContent}>
              <TextInput 
                style={[styles.fullPageInput, { marginBottom: 16 }]} 
                placeholder="Group Name" 
                placeholderTextColor="#888" 
                value={newChatName} 
                onChangeText={setNewChatName} 
              />
              
              {/* Group Image Upload */}
              <View style={[styles.row, { marginBottom: 16 }]}>
                <TouchableOpacity style={[styles.fullPageButton, { flex: 1, marginRight: 8 }]} onPress={async () => {
                  const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (lib.status !== 'granted') { Alert.alert('Permission', 'Gallery required'); return; }
                  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true });
                  if (!result.canceled && result.assets?.[0]?.uri) {
                    setGroupImageUri(result.assets[0].uri);
                    setGroupImageBase64(result.assets[0].base64 || null);
                  }
                }}>
                  <Text style={styles.fullPageButtonText}>📷 Group Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.fullPageButton, { flex: 1, marginLeft: 8 }]} onPress={async () => {
                  const cap = await ImagePicker.requestCameraPermissionsAsync();
                  if (cap.status !== 'granted') { Alert.alert('Permission', 'Camera required'); return; }
                  const result = await ImagePicker.launchCameraAsync({ quality: 0.8, base64: true });
                  if (!result.canceled && result.assets?.[0]?.uri) {
                    setGroupImageUri(result.assets[0].uri);
                    setGroupImageBase64(result.assets[0].base64 || null);
                  }
                }}>
                  <Text style={styles.fullPageButtonText}>📸 Camera</Text>
                </TouchableOpacity>
              </View>
              
              {!!groupImageUri && <Image source={{ uri: groupImageUri }} style={[styles.fullPagePreviewImage, { marginBottom: 16 }]} />}
              
              <TouchableOpacity style={styles.fullPageSubmitButton} onPress={async () => {
                if (!newChatName.trim()) { Alert.alert('Error', 'Please enter a group name'); return; }
                
                try {
                  let imageUrl = null;
                  if (groupImageUri) {
                    imageUrl = await handleImageUpload({
                      bucket: 'group-images',
                      fileUri: groupImageUri,
                      base64: groupImageBase64,
                      pathPrefix: `groups/${userData?.id}/`
                    });
                  }
                  
                  await handleCreateChat(imageUrl);
                  setGroupImageUri('');
                  setGroupImageBase64(null);
                  setPage('Chat');
                } catch (error) {
                  Alert.alert('Upload failed', error.message);
                }
              }}>
                <Text style={styles.fullPageSubmitButtonText}>🚀 Create Group</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {page === 'Profile' && (
          <View style={styles.section}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatarSection}>
                <View style={styles.userAvatarLarge}>
                  {(profileAvatarUrl || profile?.avatar_url || userData?.avatar_url) ? (
                    <Image 
                      source={{ uri: profileAvatarUrl || profile?.avatar_url || userData?.avatar_url }} 
                      style={styles.userAvatarImgLarge}
                      onError={(e) => {
                        console.log('Profile avatar load error:', e.nativeEvent.error);
                      }}
                    />
                  ) : (
                    <Text style={styles.userAvatarTextLarge}>{(userData?.username || 'U')[0].toUpperCase()}</Text>
                  )}
                </View>
                <TouchableOpacity style={styles.changeAvatarButton} onPress={async () => {
                  try {
                    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (lib.status !== 'granted') { Alert.alert('Permission', 'Gallery required'); return; }
                    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true });
                    const asset = (!result.canceled && result.assets?.[0]) ? result.assets[0] : null;
                    if (!asset) return;
                    setUpdatingAvatar(true);
                    
                    const avatarUrl = await handleImageUpload({
                      bucket: 'profile-avatars',
                      fileUri: asset.uri,
                      base64: asset.base64,
                      pathPrefix: `${userData?.id}/`
                    });
                    
                    const resp = await updateUserAvatar({ userId: userData?.id, avatarUrl });
                    console.log('UpdateUserAvatar response:', resp);
                    if (resp?.success) {
                      setProfileAvatarUrl(avatarUrl);
                      setProfile((p) => p ? { ...p, avatar_url: avatarUrl } : p);
                      Alert.alert('Profile', 'Avatar updated.');
                    } else {
                      console.error('Update avatar error:', resp?.error);
                      Alert.alert('Profile', resp?.error ? `Error: ${resp.error}` : 'Update failed.');
                    }
                  } catch (e) {
                    console.error('Profile image upload exception:', e);
                    Alert.alert('Upload failed', e.message);
                  } finally { setUpdatingAvatar(false); }
                }}>
                  <Text style={styles.changeAvatarText}>📷 Change Photo</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileUsername}>{profile?.username || userData?.username}</Text>
                <Text style={styles.profileJoinDate}>Joined {new Date(userData?.created_at || Date.now()).toLocaleDateString()}</Text>
              </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{profile?.trophies ?? userData?.trophies ?? 0}</Text>
                <Text style={styles.statLabel}>🏆 Trophies</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{profile?.seasonal_trophies ?? userData?.seasonal_trophies ?? 0}</Text>
                <Text style={styles.statLabel}>🌟 Season</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{profile?.current_streak ?? userData?.current_streak ?? 0}</Text>
                <Text style={styles.statLabel}>🔥 Streak</Text>
              </View>
            </View>

            {/* Daily Quests Section */}
            <View style={styles.profileSection}>
              <Text style={styles.profileSectionTitle}>🎯 Daily Quests</Text>
              <View style={styles.questsContainer}>
                {quests.map((q) => (
                  <View key={q.id} style={styles.dailyQuestCard}>
                    <View style={styles.questProgress}>
                      <View style={styles.questProgressBar}>
                        <View style={[styles.questProgressFill, { width: `${Math.min(100, (q.progress / q.target) * 100)}%` }]} />
                      </View>
                      <Text style={styles.questProgressText}>{q.progress}/{q.target}</Text>
                    </View>
                    <View style={styles.questInfo}>
                      <Text style={styles.questTitle}>{q.title}</Text>
                      <Text style={styles.questDescription}>{q.description}</Text>
                      <Text style={styles.questReward}>Reward: {q.reward} 🏆</Text>
                    </View>
                    <View style={styles.questAction}>
                      {q.progress >= q.target ? (
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedText}>✅ Done</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Badges Section */}
            {!!badges.length && (
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>🏅 Achievements</Text>
                <View style={styles.badgesContainer}>
                  {badges.map((b) => (
                    <View key={b.id} style={styles.badgeItem}>
                      <Text style={styles.badgeText}>{b.badge_name || b.badge_type}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Quest Completion Modal */}
            {questModal.visible && questModal.quest && (
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Complete Quest?</Text>
                  <Text style={styles.modalQuestName}>{questModal.quest.title}</Text>
                  <Text style={styles.modalQuestDescription}>{questModal.quest.description}</Text>
                  <Text style={styles.modalReward}>Reward: {questModal.quest.reward} 🏆</Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={confirmCompleteQuest}>
                      <Text style={styles.modalButtonText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setQuestModal({ visible: false, quest: null })}>
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Text style={styles.logoutButtonText}>🚪 Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
  </ScrollView>
  
      {/* Fixed chat input above footer - only on Chat page */}
      {page === 'Chat' && activeChat && (
        <View style={styles.fixedChatInputContainer}>
          <TextInput 
            style={styles.whatsappInput} 
            placeholder="Type a message" 
            placeholderTextColor="#888" 
            value={newMessage} 
            onChangeText={setNewMessage} 
            multiline 
          />
          <TouchableOpacity 
            style={styles.whatsappSendButton} 
            onPress={async () => { 
              await handleSend(); 
              await notifyNewMessage(userData?.username, newMessage); 
            }}
          >
            <Text style={styles.whatsappSendText}>→</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Bottom tabs */}
      {!['CreateQuest', 'CreateStory', 'CreateChat'].includes(page) && (
        <View style={styles.bottomTabs}>
          {[
            { key: 'Chat', icon: '💬', label: 'Chat' },
            { key: 'Stories', icon: '📚', label: 'Stories' },
            { key: 'Leaderboard', icon: '🏆', label: 'Ranking' },
            { key: 'Quests', icon: '🎯', label: 'Quests' },
            { key: 'Profile', icon: '👤', label: 'Profile' }
          ].map((tab) => (
            <TouchableOpacity key={tab.key} style={[styles.bottomTab, page === tab.key && styles.bottomTabActive]} onPress={() => setPage(tab.key)}>
              <Text style={[styles.bottomTabIcon, page === tab.key && styles.bottomTabIconActive]}>{tab.icon}</Text>
              <Text style={[styles.bottomTabText, page === tab.key && styles.bottomTabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {/* Story Viewer Modal */}
      <Modal visible={!!storyViewer} transparent animationType="fade" onRequestClose={() => setStoryViewer(null)}>
        <View style={styles.storyViewerContainer}>
          <View style={styles.storyViewerBox}>
            {storyViewer?.media_url ? (
              <Image source={{ uri: storyViewer.media_url }} style={styles.storyViewerImage} />
            ) : null}
            <Text style={styles.storyViewerAuthor}>{storyViewer?.author}</Text>
            <Text style={styles.storyViewerText}>{storyViewer?.content}</Text>
            <TouchableOpacity style={styles.closeStoryButton} onPress={() => setStoryViewer(null)}>
              <Text style={styles.closeStoryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 8,
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#2a2a4e',
    borderTopWidth: 1,
    borderTopColor: '#3b3b69',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomTab: { 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 60
  },
  bottomTabActive: { backgroundColor: '#4a90e2' },
  bottomTabIcon: { 
    fontSize: 20, 
    marginBottom: 4, 
    color: '#cccccc' 
  },
  bottomTabIconActive: { color: '#ffffff' },
  bottomTabText: { 
    color: '#cccccc', 
    fontSize: 10, 
    fontWeight: '500' 
  },
  bottomTabTextActive: { color: '#ffffff', fontWeight: 'bold' },
  
  // New Groups Styles
  addButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupsContainer: {
    gap: 12,
  },
  groupCardNew: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3b3b69',
  },
  groupAvatarNew: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4a90e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  groupAvatarImgNew: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  groupAvatarTextNew: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  groupInfoNew: {
    flex: 1,
  },
  groupNameNew: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupSubtitle: {
    color: '#ccc',
    fontSize: 14,
  },

  // Stories Styles
  addStoryContainer: {
    backgroundColor: '#1f1f3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3b3b69',
  },
  storyActionButton: {
    backgroundColor: '#3b3b69',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  storyActionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginVertical: 10,
  },
  publishButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  storiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emptyState: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  storyCard: {
    width: '48%',
    backgroundColor: '#1f1f3a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  storyImage: {
    width: '100%',
    height: 120,
  },
  storyPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#3b3b69',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyPlaceholderText: {
    fontSize: 32,
  },
  storyOverlay: {
    padding: 12,
  },
  storyAuthor: {
    color: '#4a90e2',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  storyPreview: {
    color: '#ccc',
    fontSize: 12,
  },

  // Leaderboard Styles
  leaderboardContainer: {
    gap: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3b3b69',
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4a90e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  userAvatarLeaderboard: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b3b69',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userAvatarImgLeaderboard: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userAvatarTextLeaderboard: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  leaderboardTrophies: {
    color: '#ccc',
    fontSize: 14,
  },
  crownEmoji: {
    fontSize: 24,
    marginLeft: 8,
  },

  // Quest Styles
  adminSection: {
    backgroundColor: '#1f1f3a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  adminTitle: {
    color: '#4a90e2',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  questForm: {
    gap: 12,
  },
  questFormButton: {
    backgroundColor: '#3b3b69',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  questFormButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  questPreviewImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginVertical: 10,
  },
  typeButton: {
    backgroundColor: '#3b3b69',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  typeButtonActive: {
    backgroundColor: '#4a90e2',
  },
  typeButtonText: {
    color: '#ccc',
    fontSize: 12,
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  createQuestButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  createQuestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  questsListContainer: {
    flex: 1,
  },
  questsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questsListTitle: {
    color: '#4a90e2',
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#3b3b69',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  questsList: {
    gap: 12,
  },
  questCard: {
    backgroundColor: '#1f1f3a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3b3b69',
  },
  questCardImage: {
    width: '100%',
    height: 120,
  },
  questCardPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#3b3b69',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questCardPlaceholderText: {
    fontSize: 32,
  },
  questCardContent: {
    padding: 16,
  },
  questCardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  questCardDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 12,
  },
  questCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questCardReward: {
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  questCardButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  questCardButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Profile Styles
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  changeAvatarButton: {
    backgroundColor: '#3b3b69',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  changeAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileUsername: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileJoinDate: {
    color: '#ccc',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#1f1f3a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#3b3b69',
  },
  statNumber: {
    color: '#4a90e2',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
  },
  profileSection: {
    marginBottom: 24,
  },
  profileSectionTitle: {
    color: '#4a90e2',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  questsContainer: {
    gap: 12,
  },
  dailyQuestCard: {
    backgroundColor: '#1f1f3a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3b3b69',
  },
  questProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#3b3b69',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  questProgressFill: {
    height: '100%',
    backgroundColor: '#4a90e2',
  },
  questProgressText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  questInfo: {
    marginBottom: 12,
  },
  questTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  questDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  questReward: {
    color: '#4a90e2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  questAction: {
    alignItems: 'flex-end',
  },
  completedBadge: {
    backgroundColor: '#00ff88',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  completedText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeItem: {
    backgroundColor: '#1f1f3a',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#4a90e2',
  },
  badgeText: {
    color: '#4a90e2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: '#22224e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: 300,
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  modalTitle: {
    fontSize: 20,
    color: '#4a90e2',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalQuestName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalQuestDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalReward: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonConfirm: {
    backgroundColor: '#4a90e2',
  },
  modalButtonCancel: {
    backgroundColor: '#888',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  // WhatsApp-style Chat Design
  whatsappHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#075e54',
    borderRadius: 12,
    marginBottom: 16,
  },
  whatsappTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  newChatButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  whatsappChatList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  whatsappChatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  whatsappAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  whatsappAvatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  whatsappAvatarText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 18,
  },
  whatsappChatInfo: {
    flex: 1,
  },
  whatsappChatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  whatsappChatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  whatsappChatTime: {
    fontSize: 12,
    color: '#999',
  },
  whatsappLastMessage: {
    fontSize: 14,
    color: '#666',
  },
  whatsappChatView: {
    flex: 1,
  },
  whatsappChatViewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#075e54',
    borderRadius: 12,
    marginBottom: 16,
  },
  whatsappBackButton: {
    marginRight: 16,
  },
  whatsappBackText: {
    color: '#fff',
    fontSize: 20,
  },
  whatsappChatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  whatsappChatAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  whatsappChatAvatarText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  whatsappChatHeaderInfo: {
    flex: 1,
  },
  whatsappChatHeaderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  whatsappChatHeaderStatus: {
    fontSize: 12,
    color: '#ccc',
  },
  whatsappMenuButton: {
    padding: 8,
  },
  whatsappMenuText: {
    color: '#fff',
    fontSize: 18,
  },
  whatsappMessageArea: {
    flexGrow: 1,
    paddingHorizontal: 12,
    marginBottom: 8,
    maxHeight: 500,
  },
  whatsappMessage: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  whatsappMessageSent: {
    alignSelf: 'flex-end',
    backgroundColor: '#4a90e2',
    borderBottomRightRadius: 4,
  },
  whatsappMessageReceived: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a2a4e',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#444',
  },
  whatsappMessageSender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#075e54',
    marginBottom: 4,
  },
  whatsappMessageText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  whatsappMessageTime: {
    fontSize: 10,
    color: '#ccc',
    alignSelf: 'flex-end',
  },
  whatsappInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2a2a4e',
    borderRadius: 25,
  },
  fixedChatInputContainer: {
    position: 'absolute',
    bottom: 85,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  whatsappInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#2a2a4e',
    borderRadius: 20,
    marginRight: 8,
    maxHeight: 100,
  },
  whatsappSendButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  whatsappSendText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Full Page Styles
  fullPageContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  fullPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#22224e',
    borderBottomWidth: 1,
    borderBottomColor: '#3b3b69',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  backButtonText: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fullPageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  fullPageContent: {
    flex: 1,
    padding: 20,
  },
  fullPageInput: {
    backgroundColor: '#22224e',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3b3b69',
  },
  fullPageButton: {
    backgroundColor: '#3b3b69',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  fullPageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fullPagePreviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#3b3b69',
  },
  fullPageSubmitButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  fullPageSubmitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Compact Profile Styles
  compactProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  compactStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#3b3b69',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  // Simplified per user request: no padding, margin, or background design
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
