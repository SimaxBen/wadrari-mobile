import { createClient } from '@supabase/supabase-js';

// Ultra-safe base64 encoding with multiple fallbacks
const createBase64Encoder = () => {
  // Try react-native-base64 first
  try {
    const { encode } = require('react-native-base64');
    if (encode && typeof encode === 'function') {
      return encode;
    }
  } catch (e) {}

  // Try Buffer fallback
  try {
    return (str) => Buffer.from(str, 'utf8').toString('base64');
  } catch (e) {}

  // Try btoa fallback
  try {
    if (typeof btoa !== 'undefined') {
      return btoa;
    }
  } catch (e) {}

  // Manual base64 encoding as last resort
  return (str) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    while (i < str.length) {
      const a = str.charCodeAt(i++);
      const b = i < str.length ? str.charCodeAt(i++) : 0;
      const c = i < str.length ? str.charCodeAt(i++) : 0;
      
      const bitmap = (a << 16) | (b << 8) | c;
      
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
    }
    
    return result;
  };
};

const base64Encode = createBase64Encoder();

// Hardcoded Supabase credentials
const supabaseUrl = 'https://ozggjrcnkwbodknyrpep.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96Z2dqcmNua3dib2RrbnlycGVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MzQ5NzQsImV4cCI6MjA3MjMxMDk3NH0.A7qLacSIJeCLFrC6wge6KXgn0QguO50W2yusE9uAXZ0';

// Create Supabase client for React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Plain text password (no hashing) per request
const hashPassword = (password) => password;

// Login with username and password
export const loginWithUsername = async (username, password) => {
  try {    
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

  const hashedPassword = hashPassword(password);
    
    // Query users table directly
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim())
  .eq('password', hashedPassword)
      .single();

    if (error || !user) {
      throw new Error('Invalid username or password');
    }

    // Silently update last activity - don't fail if this fails
    try {
      await supabase
        .from('users')
        .update({ 
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    } catch (updateError) {
      // Silent failure
    }

    return {
      id: user.id || 0,
      username: user.username || '',
      display_name: user.display_name || user.username || '',
      avatar_url: user.avatar_url || '',
      trophies: user.trophies || 0,
      seasonal_trophies: user.seasonal_trophies || 0,
      total_messages: user.total_messages || 0,
      total_stories: user.total_stories || 0,
      current_streak: user.current_streak || 0,
      badges: user.badges || [],
      created_at: user.created_at || null,
      last_activity: user.last_activity || null
    };
  } catch (error) {
    throw new Error('Authentication failed');
  }
};

// Test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
      
    return !error;
  } catch (error) {
    return false;
  }
};

// Fetch recent messages with lightweight user info
export const getMessages = async ({ limit = 50 } = {}) => {
  try {
    const { data, error } = await supabase
  .from('messages')
  .select('id, content, sender_id, created_at')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      message: row.content,
      user_id: row.sender_id,
      username: undefined,
      created_at: row.created_at,
      profiles: {}
    }));
  } catch (e) {
    return [];
  }
};

// Send a message from a user, optional chat_id support
export const sendMessage = async ({ userId, content, chatId = null }) => {
  if (!userId || !content) {
    return { success: false, error: 'Missing userId or content' };
  }
  try {
    const insertPayload = {
      content,
      sender_id: userId,
      created_at: new Date().toISOString()
    };
    if (chatId) insertPayload.chat_id = chatId;

    const { data, error } = await supabase
      .from('messages')
      .insert([insertPayload])
      .select('id, content, sender_id, created_at')
      .single();

    if (error) throw error;

    // Best-effort rewards: +2 trophies
    try {
      const { data: current } = await supabase
        .from('users')
        .select('trophies')
        .eq('id', userId)
        .single();
      await supabase
        .from('users')
        .update({ trophies: (current?.trophies ?? 0) + 2, updated_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (_) {}

    const normalized = {
      id: data.id,
      message: data.content,
      user_id: data.sender_id,
      username: undefined,
      created_at: data.created_at,
      profiles: {}
    };
    return { success: true, data: normalized };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// Realtime subscription to new messages
export const subscribeToMessages = (callback) => {
  try {
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const row = payload.new;
        let username = null;
        try {
          const { data: user } = await supabase
            .from('users')
            .select('username, avatar_url')
            .eq('id', row.sender_id)
            .single();
          username = user?.username || null;
        } catch (_) {}
        callback?.({
          id: row.id,
          message: row.content,
          user_id: row.sender_id,
          username,
          created_at: row.created_at,
          profiles: { username }
        });
      })
      .subscribe();
    return () => {
      try { supabase.removeChannel(channel); } catch (_) {}
    };
  } catch (e) {
    return () => {};
  }
};

// Fetch latest stories
export const getStories = async ({ limit = 20 } = {}) => {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('id, user_id, content, media_url, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(s => ({
      id: s.id,
      content: s.content,
      author: 'Unknown',
      media_url: s.media_url,
      created_at: s.created_at
    }));
  } catch (e) {
    return [];
  }
};

// Fetch leaderboard (top by trophies)
export const getLeaderboard = async ({ limit = 20 } = {}) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, trophies')
      .order('trophies', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (e) {
    return [];
  }
};

// Simple daily quests based on message count today
export const getQuestsForUser = async (userId) => {
  if (!userId) return [];
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', userId)
      .gte('created_at', startOfDay);

    const msgCount = count ?? 0;
    return [
      { id: 'daily_msg_1', title: 'Say Hello', description: 'Send 1 message today', target: 1, reward: 10, progress: msgCount },
      { id: 'daily_msg_5', title: 'Keep Talking', description: 'Send 5 messages today', target: 5, reward: 25, progress: msgCount }
    ];
  } catch (e) {
    return [
      { id: 'daily_msg_1', title: 'Say Hello', description: 'Send 1 message today', target: 1, reward: 10, progress: 0 },
      { id: 'daily_msg_5', title: 'Keep Talking', description: 'Send 5 messages today', target: 5, reward: 25, progress: 0 }
    ];
  }
};

// ==================== Chats / Groups ====================
export const getChats = async ({ includePublic = true } = {}) => {
  try {
    let query = supabase
      .from('chats')
      .select('id, name, type, image_url, created_at')
      .order('created_at', { ascending: true });
    if (!includePublic) query = query.neq('type', 'public');
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (e) {
    return [];
  }
};

export const createChat = async ({ name, type = 'group', created_by = null, image_url = null }) => {
  try {
    if (!name) throw new Error('Name required');
    const payload = { name, type, created_at: new Date().toISOString() };
    if (created_by) payload.created_by = created_by;
    if (image_url) payload.image_url = image_url;
    const { data, error } = await supabase
      .from('chats')
      .insert([payload])
      .select('id, name, type, image_url, created_at')
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const getMessagesByChat = async ({ chatId, limit = 100 }) => {
  try {
    if (!chatId) return [];
    const { data, error } = await supabase
      .from('messages')
      .select('id, content, sender_id, created_at, chat_id')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      message: row.content,
      user_id: row.sender_id,
      chat_id: row.chat_id,
      created_at: row.created_at
    }));
  } catch (e) {
    return [];
  }
};

// ==================== Storage and Stories ====================
export const uploadImage = async ({ bucket, fileUri, pathPrefix = '' }) => {
  try {
    if (!bucket || !fileUri) throw new Error('bucket and fileUri required');
    const res = await fetch(fileUri);
    const blob = await res.blob();
    const ext = (blob.type && blob.type.split('/')[1]) || 'jpg';
    const filename = `${pathPrefix}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage.from(bucket).upload(filename, blob, { contentType: blob.type || 'image/jpeg', upsert: false });
    if (error) throw error;
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return { success: true, url: pub.publicUrl };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const addStory = async ({ userId, content, mediaUrl = null, type = null }) => {
  try {
    if (!userId) throw new Error('userId required');
    const payload = {
      user_id: userId,
      content: content || null,
      media_url: mediaUrl || null,
      type: type || (mediaUrl ? 'image' : 'text'),
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('stories')
      .insert([payload])
      .select('id, user_id, content, media_url, created_at')
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// ==================== Quest completion ====================
export const completeQuest = async ({ userId, questId, reward = 0 }) => {
  try {
    if (!userId || !questId) throw new Error('userId and questId required');
    // Update trophies on users (RLS allows public update per policies)
    const { data: user } = await supabase
      .from('users')
      .select('trophies')
      .eq('id', userId)
      .single();
    const newTrophies = (user?.trophies ?? 0) + (reward || 0);
    await supabase
      .from('users')
      .update({ trophies: newTrophies, updated_at: new Date().toISOString() })
      .eq('id', userId);

    // Best-effort daily_activities bookkeeping (RLS permissive ALL)
    const today = new Date();
    const date = today.toISOString().slice(0, 10);
    try {
      const { data: existing } = await supabase
        .from('daily_activities')
        .select('id, base_trophies_earned, bonus_trophies_earned')
        .eq('user_id', userId)
        .eq('activity_date', date)
        .maybeSingle();
      if (existing?.id) {
        await supabase
          .from('daily_activities')
          .update({ base_trophies_earned: (existing.base_trophies_earned ?? 0) + (reward || 0), updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('daily_activities')
          .insert([{ user_id: userId, activity_date: date, base_trophies_earned: reward || 0, created_at: new Date().toISOString() }]);
      }
    } catch (_) {}

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};
