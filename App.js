import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert, ScrollView, Image, Modal, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { configureNotifications, notifyNewMessage, notifyStoryPosted } from './src/services/notifications';
import { 
  loginWithUsername,
  getChats,
  getMessages,
  getStories,
  getLeaderboard,
  getQuestsForUser,
  subscribeToMessages,
  getUserLikesForStories,
  getStoryReactions,
  completeQuest,
  getAllQuests,
  getUserBadges,
  getUserProfile,
  sendMessage,
  createChat,
  getMessagesByChat,
  uploadImage,
  addStory,
  unlikeStory,
  likeStory,
  getStoryComments,
  addStoryComment,
  updateUserAvatar,
  deleteQuest,
  createQuest,
  updateChat,
  updateChatImage
} from './src/services/supabase';

// Simple Error Boundary (prevent full crash)
class ErrorBoundary extends React.Component {
  constructor(props){
    super(props);
    this.state = { hasError:false, error:null, info:null };
    this._onGlobalError = this._onGlobalError.bind(this);
  }
  static getDerivedStateFromError(error){ return { hasError:true, error }; }
  componentDidCatch(error, info){
    console.log('ErrorBoundary caught', error, info);
    this.setState({ info });
  }
  componentDidMount(){
    // Capture global errors (RN globalErrorHandler or window)
    const handler = (e, isFatal) => {
      try { console.log('GlobalError', e, isFatal); } catch {}
      this.setState({ hasError:true, error: e, info:{ componentStack: (e && e.stack) ? e.stack : 'no-stack' } });
      return false; // let default continue
    };
    if (global && typeof global.ErrorUtils !== 'undefined' && typeof global.ErrorUtils.setGlobalHandler === 'function') {
      try { this._prevHandler = global.ErrorUtils.getGlobalHandler?.(); } catch {}
      try { global.ErrorUtils.setGlobalHandler(handler); } catch {}
    } else if (typeof window !== 'undefined') {
      window.addEventListener('error', this._onGlobalError);
      window.addEventListener('unhandledrejection', this._onGlobalError);
    }
  }
  componentWillUnmount(){
    try {
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', this._onGlobalError);
        window.removeEventListener('unhandledrejection', this._onGlobalError);
      }
      if (this._prevHandler && global?.ErrorUtils?.setGlobalHandler) {
        global.ErrorUtils.setGlobalHandler(this._prevHandler);
      }
    } catch {}
  }
  _onGlobalError(event){
    const err = event?.reason || event?.error || event;
    this.setState({ hasError:true, error: err, info:{ componentStack: (err && err.stack) ? err.stack : 'no-stack' } });
  }
  render(){
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loginContainer}>
            <Text style={styles.title}>⚔️ WADRARI</Text>
            <Text style={styles.subtitle}>Something went wrong.</Text>
            <View style={{ marginTop:12, maxWidth:320 }}>
              <Text style={{ color:'#ff6666', fontSize:12, textAlign:'center' }} numberOfLines={6}>
                {this.state.error ? String(this.state.error.message || this.state.error) : 'No error object captured.'}
              </Text>
              <Text style={{ color:'#888', marginTop:8, fontSize:10 }} numberOfLines={5}>
                {(this.state.info && this.state.info.componentStack) ? this.state.info.componentStack : (this.state.error?.stack || 'No stack trace available')}
              </Text>
            </View>
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
          <Text style={styles.loginButtonText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>
        <Text style={styles.demoNote}>Use: SIMAX, YassinOss, or OZA</Text>
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
  const [publishingStory, setPublishingStory] = useState(false);
  const [showStoryCreateModal, setShowStoryCreateModal] = useState(false);
  const [showCreateQuestModal, setShowCreateQuestModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [questDetail, setQuestDetail] = useState(null); // selected quest for detail modal
  const [groupEdit, setGroupEdit] = useState({ visible:false, name:'', imageUri:'', imageBase64:null });

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
        if (/network error contacting storage|RLS/i.test(error)) {
          Alert.alert('Image Upload', 'Network error contacting storage. Please check your connection and login status. If this persists, contact support.');
        }
        throw new Error(error);
      }
      
      return upload.url;
    } catch (error) {
      console.error(`${bucket} upload exception:`, error);
      throw error;
    }
  };

  useEffect(() => {
    if (!userData || !userData.id) return; // prevent running before login sets userData
    let unsubscribe = null;
    const load = async () => {
      try {
        const [ch, msgs, sts, lb, qs] = await Promise.all([
          typeof getChats === 'function' ? getChats({ includePublic: true }) : Promise.resolve([]),
          typeof getMessages === 'function' ? getMessages({ limit: 50 }) : Promise.resolve([]),
          typeof getStories === 'function' ? getStories({ limit: 20 }) : Promise.resolve([]),
          typeof getLeaderboard === 'function' ? getLeaderboard({ limit: 20 }) : Promise.resolve([]),
          typeof getQuestsForUser === 'function' ? getQuestsForUser(userData?.id) : Promise.resolve([])
        ]);
        setChats(Array.isArray(ch) ? ch : []);
        setMessages(Array.isArray(msgs) ? msgs : []);
  const storyList = Array.isArray(sts) ? sts : [];
  setStories(storyList);
        setLeaderboard(Array.isArray(lb) ? lb : []);
        let baseQuests = Array.isArray(qs) ? qs : [];
        // Always fetch completions for all quest types
        try {
          if (typeof getUserQuestDailyCompletions === 'function') {
            const comps = await getUserQuestDailyCompletions({ userId: userData.id });
            if (Array.isArray(comps) && comps.length) {
              const compMap = Object.fromEntries(comps.map(c => [c.quest_id, c]));
              baseQuests = baseQuests.map(q => {
                // Treat 'lifetime' as 'one_time' for display and logic
                let questType = q.quest_type === 'lifetime' ? 'one_time' : q.quest_type;
                const c = compMap[q.id];
                let alreadyCompleted = false;
                let progress = q.progress ?? 0;
                if (c) {
                  progress = Math.max(progress, c.completion_count || 0);
                  alreadyCompleted = progress >= (q.target || 1);
                }
                return { ...q, quest_type: questType, progress, alreadyCompleted };
              });
            }
          }
        } catch(_) {}
        setQuests(baseQuests);
        // Default to first chat (e.g., General)
  // Removed auto-opening first chat: user sees list first
      } catch (_) {}
      try {
        unsubscribe = typeof subscribeToMessages === 'function' ? subscribeToMessages((msg) => {
          if (!msg) return;
          // Only append messages for the active chat (or global if no activeChat)
          if (!activeChat || msg.chat_id === activeChat?.id || (!msg.chat_id && !activeChat)) {
            setMessages((prev) => [...prev, msg]);
          }
        }) : null;
      } catch (_) {}
      // Prefetch likes for visible stories
      try {
        const ids = (Array.isArray(stories) ? stories : storyList).map(s => s.id).filter(Boolean);
        if (ids.length && userData?.id) {
          const liked = typeof getUserLikesForStories === 'function' ? await getUserLikesForStories({ userId: userData.id, storyIds: ids }) : [];
          setMyLikedStories(Array.isArray(liked) ? liked : []);
        }
        // Like counts per story
        if (typeof getStoryReactions === 'function') {
          const reactionResults = await Promise.all(ids.map(async id => {
            try {
              const reactions = await getStoryReactions({ storyId: id });
              const count = (reactions || []).filter(r => r.reaction_type === 'like').length;
              return [id, count];
            } catch { return [id, 0]; }
          }));
          setStoryLikes(prev => {
            const updated = { ...prev };
            reactionResults.forEach(([id, count]) => { updated[id] = count; });
            return updated;
          });
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
      if (page === 'Chat') {
        setActiveChat(null);
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
  <ScrollView style={[styles.mainContainer, { marginBottom: page === 'Chat' ? 130 : 70 }]} contentContainerStyle={{ paddingBottom:140 }}>
        {/* Page header where relevant */}

        {page === 'Chat' && (
          <View style={styles.section}>
            {!activeChat ? (
              <View>
                {/* WhatsApp-style header */}
                <View style={styles.whatsappHeader}>
                  <Text style={styles.whatsappTitle}>Chats</Text>
                  <TouchableOpacity style={[styles.addButton,{paddingVertical:10,paddingHorizontal:16, marginBottom:0}]} onPress={()=> setShowCreateGroupModal(true)}>
                    <Text style={styles.addButtonText}>➕ Group</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Group list styled like quest compact list */}
                <View style={{ gap:8 }}>
                  {chats.map(c => (
                    <TouchableOpacity key={c.id} style={styles.questCardCompact} onPress={async () => {
                      setActiveChat(c);
                      const list = await getMessagesByChat({ chatId:c.id, limit:100 });
                      setMessages(Array.isArray(list)? list: []);
                    }}>
                      {c.image_url ? (
                        <Image source={{ uri:c.image_url }} style={styles.questCardImage} />
                      ) : (
                        <View style={styles.questCardPlaceholder}>
                          <Text style={styles.questCardPlaceholderText}>{(c.name||'G')[0]}</Text>
                        </View>
                      )}
                      <View style={styles.questCardCompactContent}>
                        <View style={{ flex:1 }}>
                          <Text style={styles.questCardTitle} numberOfLines={1}>{c.name}</Text>
                          {(() => {
                            // derive last message snippet from local messages state
                            const last = [...messages]
                              .filter(m => (c.id ? m.chat_id === c.id : !m.chat_id))
                              .sort((a,b)=> new Date(b.created_at) - new Date(a.created_at))[0];
                            const snippet = last ? (last.message || '').trim() : null;
                            const display = snippet && snippet.length > 0 ? snippet : (c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : 'No msgs');
                            return (
                              <Text style={styles.questCardMiniMeta} numberOfLines={1}>
                                {snippet ? `${last.username ? last.username+': ' : ''}${display}` : `Chat • ${display}`}
                              </Text>
                            );
                          })()}
                        </View>
                        <Text style={styles.questProgressBadge}>Open</Text>
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
                  <TouchableOpacity style={styles.whatsappMenuButton} onPress={() => {
                    setGroupEdit({ visible:true, name: activeChat?.name || '', imageUri:'', imageBase64:null });
                  }}>
                    <Text style={styles.whatsappMenuText}>⋮</Text>
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  data={messages.filter(m => activeChat?.id ? m.chat_id === activeChat.id : true)}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.whatsappMessageArea}
                  ref={messageScrollRef}
                  onContentSizeChange={() => { if (messageScrollRef.current) messageScrollRef.current.scrollToEnd({ animated: true }); }}
                  renderItem={({ item: m }) => (
                    <View style={[styles.whatsappMessage, m.sender_id === userData?.id ? styles.whatsappMessageSent : styles.whatsappMessageReceived]}>
                      {m.sender_id !== userData?.id && (
                        <Text style={styles.whatsappMessageSender}>{m.username || 'User'}</Text>
                      )}
                      <Text style={styles.whatsappMessageText}>{m.message}</Text>
                      <Text style={styles.whatsappMessageTime}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  )}
                />
              </View>
            )}
          </View>
        )}

        {page === 'Stories' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Stories</Text>
            
            {/* Add Story Button */}
            <TouchableOpacity style={styles.addButton} onPress={() => setShowStoryCreateModal(true)}>
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
              <Text style={styles.title}>🐉 {seasonName}</Text>
              <Text style={{ color: '#ccc' }}>60% carryover enabled</Text>
            </View>
            
            <Text style={styles.sectionTitle}>🏅 Top Players</Text>
            <View style={styles.leaderboardContainer}>
              {leaderboard.map((u, i) => {
                const lastIndex = leaderboard.length - 1;
                const isFirst = i === 0;
                const isSecond = i === 1 && leaderboard.length > 2; // only show silver if more than 2 users
                const isLast = i === lastIndex && leaderboard.length > 1; // poop for last if at least 2 users
                let endIcon = null;
                if (isFirst) endIcon = '👑';
                else if (isSecond) endIcon = '♕';
                else if (isLast) endIcon = '💩';
                return (
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
                    {endIcon && <Text style={styles.crownEmoji}>{endIcon}</Text>}
                  </View>
                );
              })}
            </View>
          </View>
        )}

    {page === 'Quests' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Quests & Challenges</Text>
            
            {/* Add Quest Button for Admin */}
            {userData?.username === 'SIMAX' && (
      <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateQuestModal(true)}>
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
                {allQuests
                  .slice()
                  .sort((a,b) => {
                     const aCompleted = !!quests.find(qq=>qq.id===a.id && qq.progress>=qq.target);
                     const bCompleted = !!quests.find(qq=>qq.id===b.id && qq.progress>=qq.target);
                     if (aCompleted === bCompleted) return 0;
                     return aCompleted ? 1 : -1; // completed go last
                  })
                  .map((q) => {
                  // Determine completion state based on quest_type
                  const userQuest = quests.find(qq => qq.id === q.id);
                  const alreadyCompleted = userQuest ? (userQuest.progress >= userQuest.target) : false;
                  const isRepeatable = q.quest_type === 'repeatable';
                  const canComplete = !alreadyCompleted || isRepeatable;
                  return (
                  <TouchableOpacity key={q.id} style={[styles.questCardCompact, alreadyCompleted && !isRepeatable && styles.questCardCompleted]} onPress={() => setQuestDetail({ ...q, alreadyCompleted, isRepeatable, canComplete })}>
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
                    <View style={styles.questCardCompactContent}>
                      <View style={{ flex:1 }}>
                        <Text style={styles.questCardTitle} numberOfLines={1}>{q.name}</Text>
                        <Text style={styles.questCardMiniMeta}>🏆 {q.trophy_reward || q.reward || 0} • {q.quest_type || 'type'}</Text>
                      </View>
                      <View>
                        <Text style={[styles.questProgressBadge, alreadyCompleted && !isRepeatable && { backgroundColor:'#2d3a2d', color:'#6fa86f' }]}>
                          {alreadyCompleted && !isRepeatable ? 'Done' : `${userQuest ? userQuest.progress : 0}/${userQuest ? userQuest.target : (q.target||1)}`}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )})}
              </View>
            </View>
          </View>
  )}

        {page === 'Profile' && (
          <View style={styles.section}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={[styles.profileAvatarRow] }>
                <View style={[styles.userAvatarLarge, { borderWidth:3, borderColor:'#4a90e2', shadowColor:'#4a90e2', shadowOpacity:0.4, shadowRadius:8 }] }>
                  {(profile?.avatar_url || userData?.avatar_url) ? (
                    <Image
                      source={{ uri: profile?.avatar_url || userData?.avatar_url }}
                      style={styles.userAvatarImgLarge}
                      onError={(e) => console.log('Profile avatar load error:', e.nativeEvent.error)}
                    />
                  ) : (
                    <Text style={styles.userAvatarTextLarge}>{(userData?.username || 'U')[0].toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flexDirection:'column', gap:8, alignItems:'flex-start' }}>
                  <TouchableOpacity style={styles.changeAvatarButton} onPress={async () => {
                    try {
                      setUpdatingAvatar(true);
                      const seed = `${userData?.username || 'user'}-${Date.now()}`;
                      // Dicebear generated PNG avatar URL (no upload needed)
                      const avatarUrl = `https://api.dicebear.com/7.x/identicon/png?seed=${encodeURIComponent(seed)}&backgroundColor=1a1a2e,4a90e2&radius=50`;
                      const resp = await updateUserAvatar({ userId: userData?.id, avatarUrl });
                      if (resp?.success) {
                        setProfile((p) => p ? { ...p, avatar_url: avatarUrl } : { avatar_url: avatarUrl });
                        userData.avatar_url = avatarUrl; // optimistic local update
                        Alert.alert('Profile', 'New avatar generated.');
                      } else {
                        Alert.alert('Profile', resp?.error || 'Update failed');
                      }
                    } catch(e){
                      Alert.alert('Avatar', e.message);
                    } finally { setUpdatingAvatar(false); }
                  }}>
                    <Text style={styles.changeAvatarText}>{updatingAvatar ? '⌛ Generating...' : '🎲 Generate Avatar'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.changeAvatarButton,{ backgroundColor:'#2a3245' }]} onPress={async () => {
                    try {
                      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (!perm.granted) { Alert.alert('Avatar','Permission denied'); return; }
                      const img = await ImagePicker.launchImageLibraryAsync({ allowsEditing:true, quality:0.7, base64:true });
                      if (img.canceled) return;
                      setUpdatingAvatar(true);
                      const asset = img.assets[0];
                      const upload = await uploadImage({ bucket:'profile-avatars', fileUri:asset.uri, base64:asset.base64||null, pathPrefix:`${userData?.id}/` });
                      if (!upload?.success) throw new Error(upload?.error||'Upload failed');
                      const newUrl = upload.url;
                      const resp = await updateUserAvatar({ userId: userData?.id, avatarUrl: newUrl });
                      if (resp?.success) {
                        setProfile(p => p ? { ...p, avatar_url:newUrl } : { avatar_url:newUrl });
                        userData.avatar_url = newUrl;
                        Alert.alert('Profile','Avatar updated');
                      } else {
                        Alert.alert('Profile', resp?.error || 'Update failed');
                      }
                    } catch(e){
                      Alert.alert('Avatar', e.message);
                    } finally { setUpdatingAvatar(false); }
                  }}>
                    <Text style={styles.changeAvatarText}>{updatingAvatar ? '⌛ Uploading...' : '📤 Upload Picture'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ marginLeft:16, flex:1, justifyContent:'center' }}>
                  <Text style={[styles.profileUsername, { textAlign:'left', marginTop:4 }]}>{profile?.username || userData?.username}</Text>
                  <Text style={[styles.profileJoinDate, { textAlign:'left' }]}>Joined {new Date(userData?.created_at || Date.now()).toLocaleDateString()}</Text>
                </View>
              </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{profile?.trophies ?? userData?.trophies ?? 0}</Text>
                <Text style={styles.statLabel}>🏆 Trophies</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{profile?.current_streak ?? userData?.current_streak ?? 0}</Text>
                <Text style={styles.statLabel}>🔥 Streak</Text>
              </View>
            </View>

            {/* Daily Quests Section */}
            <View style={styles.profileSection}>
              <Text style={styles.profileSectionTitle}>🎯 Active Quests</Text>
              <View style={styles.questsContainer}>
                {quests.filter(q => q.progress < q.target).map((q) => (
                  <View key={q.id} style={styles.dailyQuestCard}>
                    <View style={styles.questProgress}>
                      <View style={styles.questProgressBar}>
                        <View style={[styles.questProgressFill, { width: `${Math.min(100, (q.progress / q.target) * 100)}%` }]} />
                      </View>
                      <Text style={styles.questProgressText}>{q.progress}/{q.target}</Text>
                    </View>
                    <View style={styles.questInfo}>
                      <Text style={styles.questTitle}>{q.title || q.name}</Text>
                      <Text style={styles.questDescription}>{q.description}</Text>
                      <Text style={styles.questReward}>Reward: {(q.reward || q.trophy_reward || 0)} 🏆</Text>
                    </View>
                  </View>
                ))}
                {quests.filter(q => q.progress < q.target).length === 0 && (
                  <Text style={{ color:'#888', fontSize:12 }}>All quests completed 🎉</Text>
                )}
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
      
  {/* Bottom tabs (hidden only for full-screen create chat) */}
  {!['CreateChat'].includes(page) && (
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
      {/* Quest Detail Modal */}
      <Modal visible={!!questDetail} transparent animationType="fade" onRequestClose={() => setQuestDetail(null)}>
        <View style={styles.questDetailOverlay}>
          <View style={styles.questDetailCard}>
            <Text style={styles.questDetailTitle}>{questDetail?.name}</Text>
            <Text style={styles.questDetailMeta}>Type: {questDetail?.quest_type || 'unknown'} • 🏆 {questDetail?.trophy_reward || questDetail?.reward || 0}</Text>
            <ScrollView style={styles.questDetailScroll}>
              <Text style={styles.questDetailDescription}>{questDetail?.description || 'No description.'}</Text>
            </ScrollView>
            <View style={styles.questDetailButtons}>
              {!!(questDetail && (questDetail.canComplete)) && (
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={async () => {
                  try {
                    const reward = questDetail.trophy_reward || questDetail.reward || 0;
                    if (!questDetail?.id) return;
                    const res = await completeQuest({ userId: userData?.id, questId: questDetail.id, reward });
                    if (res?.success) {
                      setQuests(prev => {
                        const exists = questDetail?.id ? prev.find(p => p.id === questDetail.id) : null;
                        if (exists) {
                          if (!questDetail?.id) return prev;
                          return prev.map(p => (p.id === questDetail.id ? { ...p, progress: p.target || exists.target } : p));
                        }
                        return questDetail?.id ? [...prev, { id: questDetail.id, progress: (questDetail.target || 1), target: (questDetail.target || 1), reward }] : prev;
                      });
                      if (reward) {
                        userData.trophies = (userData.trophies || 0) + reward;
                        setLeaderboard(prev => prev.map(l => l.id === userData.id ? { ...l, trophies: (l.trophies||0)+reward } : l));
                      }
                      setQuestDetail(null);
                      Alert.alert('Quest', `Completed! +${reward} 🏆`);
                    } else if (res?.error) {
                      Alert.alert('Quest', res.error);
                    }
                  } catch(e){
                    Alert.alert('Quest', e.message);
                  }
                }}>
                  <Text style={styles.modalButtonText}>Complete</Text>
                </TouchableOpacity>
              )}
              {userData?.username === 'SIMAX' && !!questDetail && (
                <TouchableOpacity style={[styles.modalButton, { backgroundColor:'#b33939' }]} onPress={async () => {
                  if (!deleteQuest) { Alert.alert('Admin','Delete not implemented'); return; }
                  try {
                    if (!questDetail?.id) return;
                    const res = await deleteQuest({ questId: questDetail.id });
                    if (res?.success) {
                      setAllQuests(prev => questDetail?.id ? prev.filter(q => q.id !== questDetail.id) : prev);
                      setQuestDetail(null);
                    } else {
                      Alert.alert('Delete', res?.error || 'Failed');
                    }
                  } catch(e){ Alert.alert('Delete', e.message); }
                }}>
                  <Text style={styles.modalButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setQuestDetail(null)}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Create Story Modal */}
      <Modal visible={showStoryCreateModal} transparent animationType="fade" onRequestClose={()=> setShowStoryCreateModal(false)}>
        <View style={styles.storyCreateOverlay}>
          <View style={styles.storyCreateCard}>
            <ScrollView contentContainerStyle={{ padding:20 }}>
              <Text style={styles.storyCreateTitle}>Create Story</Text>
              <TextInput
                placeholder="What's happening?"
                placeholderTextColor="#666"
                value={storyText}
                onChangeText={setStoryText}
                multiline
                style={{ minHeight:100, backgroundColor:'#1f2535', color:'#fff', padding:12, borderRadius:16, borderWidth:1, borderColor:'#2a3245', marginBottom:16 }}
              />
              {storyImageUri ? (
                <Image source={{ uri: storyImageUri }} style={{ width:'100%', height:200, borderRadius:16, marginBottom:16 }} />
              ) : (
                <TouchableOpacity onPress={async () => {
                  try {
                    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (!perm.granted) { Alert.alert('Image','Permission denied'); return; }
                    const img = await ImagePicker.launchImageLibraryAsync({ allowsEditing:true, quality:0.7, base64:true });
                    if (!img.canceled) {
                      const asset = img.assets[0];
                      setStoryImageUri(asset.uri); setStoryImageBase64(asset.base64 || null);
                    }
                  } catch(e){ Alert.alert('Image','Pick failed'); }
                }} style={{ backgroundColor:'#1f2535', borderWidth:1, borderColor:'#2a3245', borderRadius:16, padding:24, alignItems:'center', marginBottom:16 }}>
                  <Text style={{ color:'#4a90e2' }}>📷 Add Image</Text>
                </TouchableOpacity>
              )}
              <View style={{ flexDirection:'row', gap:12 }}>
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={async () => {
                  try {
                    if (!storyText.trim() && !storyImageUri) { Alert.alert('Story','Add text or image'); return; }
                    setPublishingStory(true);
                    let mediaUrl = null;
                    if (storyImageUri) {
                      const upload = await uploadImage({ bucket:'story-images', fileUri: storyImageUri, base64: storyImageBase64, pathPrefix:`${userData?.id}/` });
                      if (upload?.success) mediaUrl = upload.url; else throw new Error(upload?.error||'Upload failed');
                    }
                    const res = await addStory({ userId:userData?.id, content:storyText.trim(), mediaUrl });
                    if (res?.success && res.data) {
                      setStories(prev => [{ ...res.data, author: userData?.username }, ...prev]);
                      setShowStoryCreateModal(false);
                      setStoryText(''); setStoryImageUri(''); setStoryImageBase64(null);
                      notifyStoryPosted(userData?.username||'Someone');
                    } else { Alert.alert('Story', res?.error||'Failed'); }
                  } catch(e){ Alert.alert('Story', e.message); } finally { setPublishingStory(false); }
                }}>
                  <Text style={styles.modalButtonText}>{publishingStory? '...' : 'Post'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={()=> { setShowStoryCreateModal(false); }}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Quest Modal */}
      <Modal visible={showCreateQuestModal} transparent animationType="fade" onRequestClose={()=> setShowCreateQuestModal(false)}>
        <View style={styles.questCreateOverlay}>
          <View style={styles.questCreateCard}>
            <ScrollView contentContainerStyle={{ padding:4 }}>
              <Text style={styles.questCreateTitle}>New Quest</Text>
              <TextInput placeholder="Quest Name" placeholderTextColor="#666" value={questForm.name} onChangeText={t=> setQuestForm(f=>({...f,name:t}))} style={{ backgroundColor:'#1f2535', color:'#fff', padding:12, borderRadius:12, borderWidth:1, borderColor:'#2a3245', marginBottom:12 }} />
              <TextInput placeholder="Description" placeholderTextColor="#666" value={questForm.description} onChangeText={t=> setQuestForm(f=>({...f,description:t}))} multiline style={{ backgroundColor:'#1f2535', color:'#fff', padding:12, borderRadius:12, borderWidth:1, borderColor:'#2a3245', minHeight:80, marginBottom:12 }} />
              <TextInput placeholder="Reward (trophies)" placeholderTextColor="#666" value={questForm.reward} onChangeText={t=> setQuestForm(f=>({...f,reward:t}))} keyboardType="numeric" style={{ backgroundColor:'#1f2535', color:'#fff', padding:12, borderRadius:12, borderWidth:1, borderColor:'#2a3245', marginBottom:12 }} />
              <TextInput placeholder="Target (default 1)" placeholderTextColor="#666" value={questForm.target||''} onChangeText={t=> setQuestForm(f=>({...f,target:t}))} keyboardType="numeric" style={{ backgroundColor:'#1f2535', color:'#fff', padding:12, borderRadius:12, borderWidth:1, borderColor:'#2a3245', marginBottom:12 }} />
              <View style={{ flexDirection:'row', marginBottom:16, gap:8 }}>
                {['daily','repeatable','one_time'].map(t => {
                  const selected = questForm.type === t || (t === 'one_time' && questForm.type === 'lifetime');
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setQuestForm(f => ({ ...f, type:t }))}
                      style={{ flex:1, backgroundColor: selected ? '#4a90e2' : '#1f2535', paddingVertical:12, borderRadius:12, borderWidth:1, borderColor: selected ? '#4a90e2' : '#2a3245', alignItems:'center' }}
                    >
                      <Text style={{ color:'#fff', fontSize:12, fontWeight:selected?'bold':'normal', textTransform:'capitalize' }}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {questImageUri ? (
                <Image source={{ uri: questImageUri }} style={{ width:'100%', height:160, borderRadius:12, marginBottom:12 }} />
              ) : (
                <TouchableOpacity onPress={async () => {
                  try { const perm = await ImagePicker.requestMediaLibraryPermissionsAsync(); if(!perm.granted){Alert.alert('Image','Denied'); return;} const img= await ImagePicker.launchImageLibraryAsync({ allowsEditing:true, quality:0.7, base64:true }); if(!img.canceled){ const asset=img.assets[0]; setQuestImageUri(asset.uri); setQuestImageBase64(asset.base64||null);} } catch(e){ Alert.alert('Image','Pick failed'); }
                }} style={{ backgroundColor:'#1f2535', borderWidth:1, borderColor:'#2a3245', borderRadius:12, padding:24, alignItems:'center', marginBottom:16 }}>
                  <Text style={{ color:'#4a90e2' }}>🖼️ Add Image</Text>
                </TouchableOpacity>
              )}
              <View style={{ flexDirection:'row', gap:12 }}>
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={async ()=> {
                  try {
                    if (!questForm.name.trim()) { Alert.alert('Quest','Name required'); return; }
                    let imageUrl=null;
                    if (questImageUri) {
                      const upload = await uploadImage({ bucket:'quest-images', fileUri:questImageUri, base64:questImageBase64, pathPrefix:`${userData?.id}/` });
                      if (upload?.success) imageUrl = upload.url; else throw new Error(upload?.error||'Upload failed');
                    }
                    const res = await createQuest({ name:questForm.name.trim(), description:questForm.description.trim(), trophy_reward:parseInt(questForm.reward)||0, quest_type:questForm.type||'daily', image_url:imageUrl, max_completions_per_day: questForm.target ? parseInt(questForm.target) : null, created_by: userData?.id });
                    if (res?.success && res.data) {
                      setAllQuests(prev => [res.data, ...prev]);
                      setShowCreateQuestModal(false);
                      setQuestForm({ name:'', description:'', reward:'10', type:'daily' }); setQuestImageUri(''); setQuestImageBase64(null);
                    } else { Alert.alert('Quest', res?.error||'Failed'); }
                  } catch(e){ Alert.alert('Quest', e.message); }
                }}>
                  <Text style={styles.modalButtonText}>Create</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={()=> setShowCreateQuestModal(false)}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Group Modal */}
      <Modal visible={showCreateGroupModal} transparent animationType="fade" onRequestClose={()=> setShowCreateGroupModal(false)}>
        <View style={styles.questDetailOverlay}>
          <View style={styles.questDetailCard}>
            <Text style={styles.questDetailTitle}>New Group</Text>
            <TextInput value={newChatName} onChangeText={setNewChatName} placeholder="Group Name" placeholderTextColor="#666" style={{ backgroundColor:'#1f2535', color:'#fff', padding:12, borderRadius:12, borderWidth:1, borderColor:'#2a3245', marginBottom:16 }} />
            {groupImageUri ? (
              <Image source={{ uri: groupImageUri }} style={{ width:120, height:120, borderRadius:60, alignSelf:'center', marginBottom:16 }} />
            ) : (
              <TouchableOpacity onPress={async () => {
                try { const perm = await ImagePicker.requestMediaLibraryPermissionsAsync(); if(!perm.granted){Alert.alert('Image','Denied'); return;} const img= await ImagePicker.launchImageLibraryAsync({ allowsEditing:true, quality:0.7, base64:true }); if(!img.canceled){ const asset=img.assets[0]; setGroupImageUri(asset.uri); setGroupImageBase64(asset.base64||null);} } catch(e){ Alert.alert('Image','Pick failed'); }
              }} style={{ backgroundColor:'#1f2535', borderWidth:1, borderColor:'#2a3245', borderRadius:16, padding:24, alignItems:'center', marginBottom:16 }}>
                <Text style={{ color:'#4a90e2' }}>🖼️ Add Group Image</Text>
              </TouchableOpacity>
            )}
            <View style={{ flexDirection:'row', gap:12 }}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={async () => {
                try {
                  if (!newChatName.trim()) { Alert.alert('Group','Name required'); return; }
                  let imageUrl=null;
                  if (groupImageUri) {
                    const upload = await uploadImage({ bucket:'group-images', fileUri:groupImageUri, base64:groupImageBase64, pathPrefix:`${userData?.id}/` });
                    if (upload?.success) imageUrl = upload.url; else throw new Error(upload?.error||'Upload failed');
                  }
                  const res = await createChat({ name:newChatName.trim(), type:'group', created_by: userData?.id, image_url: imageUrl });
                  if (res?.success && res.data) {
                    setChats(prev => [res.data, ...prev]);
                    setShowCreateGroupModal(false); setNewChatName(''); setGroupImageUri(''); setGroupImageBase64(null);
                  } else { Alert.alert('Group', res?.error||'Failed'); }
                } catch(e){ Alert.alert('Group', e.message); }
              }}>
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={()=> setShowCreateGroupModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Group Settings Modal */}
      <Modal visible={groupEdit.visible} transparent animationType="fade" onRequestClose={()=> setGroupEdit(g => ({ ...g, visible:false }))}>
        <View style={styles.questDetailOverlay}>
          <View style={styles.questDetailCard}>
            <Text style={styles.questDetailTitle}>Edit Group</Text>
            <TextInput
              value={groupEdit.name}
              onChangeText={t => setGroupEdit(g => ({ ...g, name:t }))}
              placeholder="Group Name"
              placeholderTextColor="#666"
              style={{ backgroundColor:'#1f2235', color:'#fff', padding:12, borderRadius:12, marginBottom:16, borderWidth:1, borderColor:'#2a3245' }}
            />
            <View style={{ alignItems:'center', marginBottom:16 }}>
              {groupEdit.imageUri || activeChat?.image_url ? (
                <Image source={{ uri: groupEdit.imageUri || activeChat.image_url }} style={{ width:96, height:96, borderRadius:48, marginBottom:12 }} />
              ) : (
                <View style={{ width:96, height:96, borderRadius:48, backgroundColor:'#2a3245', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                  <Text style={{ color:'#4a90e2', fontSize:24 }}>{(groupEdit.name||activeChat?.name||'G')[0]}</Text>
                </View>
              )}
              <TouchableOpacity onPress={async () => {
                try {
                  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (!perm.granted) { Alert.alert('Image','Permission denied'); return; }
                  const img = await ImagePicker.launchImageLibraryAsync({ allowsEditing:true, quality:0.7, base64:true });
                  if (!img.canceled) {
                    const asset = img.assets[0];
                    setGroupEdit(g => ({ ...g, imageUri: asset.uri, imageBase64: asset.base64 }));
                  }
                } catch(e){ Alert.alert('Image','Pick failed'); }
              }} style={{ backgroundColor:'#2a3245', paddingVertical:10, paddingHorizontal:20, borderRadius:20 }}>
                <Text style={{ color:'#fff', fontSize:12 }}>Choose Image</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection:'row', gap:12 }}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={async () => {
                try {
                  if (!activeChat?.id) return;
                  let imageUrl = null;
                  if (groupEdit.imageUri) {
                    const upload = await uploadImage({ bucket:'group-images', fileUri: groupEdit.imageUri, base64: groupEdit.imageBase64, pathPrefix:`${userData?.id}/` });
                    if (upload?.success) imageUrl = upload.url; else if (upload?.error) throw new Error(upload.error);
                  }
                  const res = await updateChat({ chatId: activeChat?.id, name: groupEdit.name, imageUrl });
                  if (res?.success) {
                    setChats(prev => prev.map(c => (activeChat?.id && c.id === activeChat.id) ? { ...c, name: groupEdit.name || c.name, image_url: imageUrl || c.image_url } : c));
                    setActiveChat(c => c ? { ...c, name: groupEdit.name || c.name, image_url: imageUrl || c.image_url } : c);
                    setGroupEdit(g => ({ ...g, visible:false }));
                  } else if (res?.error) {
                    Alert.alert('Group', res.error);
                  }
                } catch(e){ Alert.alert('Group', e.message); }
              }}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={()=> setGroupEdit(g => ({ ...g, visible:false }))}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Story Viewer Modal with likes & comments */}
  <Modal
        visible={!!storyViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setStoryViewer(null)}
        onShow={async () => {
          try {
            if (!storyViewer?.id) return;
            // fetch reactions (likers)
            const reactions = (storyViewer?.id && typeof getStoryReactions === 'function') ? await getStoryReactions({ storyId: storyViewer.id }) : [];
            const likeUsers = (reactions || []).filter(r => r.reaction_type === 'like').map(r => r.user_id);
            // fetch usernames for likers
            // reuse existing storyComments structure for display; load comments
            if (storyViewer?.id && typeof loadComments === 'function') await loadComments(storyViewer.id);
            // map user ids -> usernames from existing stories list if available
            // We'll store usernames separately inside local state-like derived arrays (no extra state variable to keep patch small)
            if (storyViewer?.id) setStoryLikes(prev => ({ ...prev, [storyViewer.id]: likeUsers.length }));
          } catch (e) { console.log('Story modal load error', e); }
        }}
      >
        <View style={styles.storyViewerContainer}>
          <View style={styles.storyViewerBox}>
            {!!storyViewer?.media_url && (
              <Image source={{ uri: storyViewer.media_url }} style={styles.storyViewerImage} />
            )}
            <View style={styles.storyViewerHeader}>
              <Text style={styles.storyViewerAuthor}>{storyViewer?.author}</Text>
              <TouchableOpacity onPress={() => setStoryViewer(null)} style={styles.closeStoryButton}>
                <Text style={styles.closeStoryButtonText}>✖</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.storyViewerContent}>
              <Text style={styles.storyViewerText}>{storyViewer?.content}</Text>
              {/* Likes Section */}
              <View style={{ marginTop:16, marginBottom:12 }}>
                <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
                  <Text style={{ color:'#4a90e2', fontWeight:'bold' }}>❤️ Likes ({storyLikes[storyViewer?.id] || 0})</Text>
                  <TouchableOpacity
                    onPress={() => storyViewer?.id && toggleLike(storyViewer.id)}
                    style={{ backgroundColor:'#2a3245', paddingVertical:6, paddingHorizontal:14, borderRadius:20 }}
                  >
                    <Text style={{ color:'#fff', fontSize:12 }}>
                      {storyViewer?.id && myLikedStories.includes(storyViewer.id) ? 'Unlike' : 'Like'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* Comments Section */}
              <View style={{ marginTop:4 }}>
                <Text style={{ color:'#4a90e2', fontWeight:'bold', marginBottom:8 }}>💬 Comments</Text>
                {storyViewer?.id && (storyComments[storyViewer.id] || []).length === 0 && (
                  <Text style={{ color:'#777', fontSize:12 }}>No comments yet</Text>
                )}
                {storyViewer?.id && (storyComments[storyViewer.id] || []).map(c => (
                  <View key={c.id} style={{ marginBottom:10, backgroundColor:'#1f2535', padding:10, borderRadius:12, borderWidth:1, borderColor:'#2a3245' }}>
                    <Text style={{ color:'#4a90e2', fontSize:12, fontWeight:'bold', marginBottom:4 }}>{c.username || 'User'}</Text>
                    <Text style={{ color:'#e0e6f2', fontSize:13 }}>{c.content}</Text>
                    <Text style={{ color:'#666', fontSize:10, marginTop:4 }}>{new Date(c.created_at).toLocaleString()}</Text>
                  </View>
                ))}
                {/* Add comment input */}
                <View style={{ flexDirection:'row', alignItems:'center', marginTop:8, gap:8 }}>
                  <TextInput
                    value={newCommentText}
                    onChangeText={setNewCommentText}
                    placeholder="Write a comment..."
                    placeholderTextColor="#666"
                    style={{ flex:1, backgroundColor:'#2a3245', color:'#fff', paddingHorizontal:12, paddingVertical:10, borderRadius:20, fontSize:13 }}
                  />
                  <TouchableOpacity
                    onPress={() => storyViewer?.id && sendComment(storyViewer.id)}
                    style={{ backgroundColor:'#4a90e2', paddingHorizontal:16, paddingVertical:10, borderRadius:20 }}
                  >
                    <Text style={{ color:'#fff', fontWeight:'bold', fontSize:12 }}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
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
  width: 56,
  height: 56,
  borderRadius: 10,
  },
  questCardPlaceholder: {
  width: 56,
  height: 56,
  backgroundColor: '#3b3b69',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 10,
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
  // Compact quest list styles
  questCardCompact: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#1f1f3a',
  borderRadius: 12,
  padding: 8,
  marginBottom: 8,
  borderWidth: 1,
  borderColor: '#2d3250',
  minHeight: 64,
  },
  questCardCompleted: {
    opacity: 0.5,
  },
  questCardCompactContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    gap: 8,
  },
  questCardMiniMeta: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  questProgressBadge: {
    backgroundColor: '#2a2f45',
    color: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    fontSize: 12,
    overflow: 'hidden',
  },
  // Quest Detail Modal
  questDetailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  questDetailCard: {
  width: '100%',
  maxWidth: 600,
    backgroundColor: '#22263a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#3b4a6a',
  },
  questDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 8,
  },
  questDetailMeta: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 12,
  },
  questDetailScroll: {
    maxHeight: 250,
    marginBottom: 20,
  },
  questDetailDescription: {
    color: '#e0e6f2',
    fontSize: 14,
    lineHeight: 20,
  },
  questDetailButtons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  // Create Quest Modal styles
  questCreateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  questCreateCard: {
  width: '100%',
  maxWidth: 640,
    backgroundColor: '#22263a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3b4a6a',
  },
  questCreateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 16,
    textAlign: 'center',
  },

  // Profile Styles
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'flex-start',
    gap: 16,
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
  width: '100%',
  maxWidth: 500,
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
    backgroundColor: '#22263a',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#33415a'
  },
  whatsappTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a90e2',
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
  backgroundColor: '#1f2235',
    borderRadius: 12,
    overflow: 'hidden',
  },
  whatsappChatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2f45',
  },
  whatsappAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2f45',
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
    backgroundColor: '#1f2235',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2f45'
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
    backgroundColor: '#2a2f45',
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
  // Story Viewer & Creation Modal Enhancements
  storyCreateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,20,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  storyCreateCard: {
  width: '100%',
  maxWidth: 560,
    backgroundColor: '#22263a',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#32415a',
  },
  storyCreateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a90e2',
    marginBottom: 12,
    textAlign: 'center',
  },
  storyViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  storyViewerBox: {
  width: '100%',
  maxWidth: 640,
    backgroundColor: '#1f2535',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#32415a',
  },
  storyViewerImage: {
    width: '100%',
    height: 260,
    backgroundColor: '#2a2f45',
  },
  storyViewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  storyViewerAuthor: {
    color: '#4a90e2',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeStoryButton: {
    padding: 8,
    backgroundColor: '#2a3245',
    borderRadius: 20,
    minWidth: 36,
    alignItems: 'center',
  },
  closeStoryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  storyViewerContent: {
    maxHeight: 240,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
  },
  storyViewerText: {
    color: '#e0e6f2',
    fontSize: 15,
    lineHeight: 22,
  },
});

// Export with Error Boundary
export default () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
