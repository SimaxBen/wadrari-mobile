// Enhanced MCP Client for React Native with better error handling
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Get environment variables with fallbacks
const getEnvVar = (key, fallback) => {
  // Try multiple ways to get env vars
  const value = 
    Constants.expoConfig?.extra?.[key] ||
    Constants.manifest?.extra?.[key] ||
    process.env[key] ||
    process.env[`EXPO_PUBLIC_${key}`] ||
    fallback;
  
  return value;
};

const supabaseUrl = getEnvVar('SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL);
const supabaseKey = getEnvVar('SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

console.log('=== Supabase Configuration ===');
console.log('Platform:', Platform.OS);
console.log('URL:', supabaseUrl);
console.log('Key present:', !!supabaseKey);
console.log('Key preview:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'undefined');

if (!supabaseUrl || !supabaseKey) {
  const msg = `Missing Supabase configuration. URL present: ${!!supabaseUrl}, Key present: ${!!supabaseKey}.\n` +
    'Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your CI Environment Group (expo) and app.json extra if needed.';
  console.error('❌ ' + msg);
}

// Storage adapter for Supabase using SecureStore
const ExpoSecureStorageAdapter = {
  getItem: async (key) => {
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  setItem: async (key, value) => {
    try { await SecureStore.setItemAsync(key, value); } catch {}
  },
  removeItem: async (key) => {
    try { await SecureStore.deleteItemAsync(key); } catch {}
  }
};

// Initialize Supabase client with persistent session in RN
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: ExpoSecureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
    })
  : null;

class SupabaseMCPClient {
  constructor() {
  this.supabase = supabase;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  this._realtimeChannel = null;
  this._defaultChatCache = null;
  this._userCache = new Map();
    console.log('🔧 Initializing MCP Client for React Native...');
  }

  async testConnection() {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not configured');
      }
      console.log('🔍 Testing Supabase connection...');
      
      // Use a simple query to test connection
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1)
        .single();
      
      if (error && !error.message.includes('multiple rows')) {
        console.error('❌ Supabase connection test failed:', error.message);
        this.isConnected = false;
        throw error;
      } else {
        console.log('✅ Supabase connection test successful');
        this.isConnected = true;
      }
    } catch (error) {
      console.error('❌ Supabase connection error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async callTool(toolName, params = {}) {
    try {
      console.log(`🔧 Calling tool: ${toolName}`, params);
      if (!this.supabase && toolName !== 'loginUser' && toolName !== 'registerUser') {
        throw new Error('Backend not configured');
      }
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );

      const result = await Promise.race([
        this._callToolInternal(toolName, params),
        timeoutPromise
      ]);

      console.log(`✅ Tool ${toolName} completed successfully`);
      this.retryCount = 0; // Reset retry count on success
      return result;
      
    } catch (error) {
      console.error(`❌ Tool ${toolName} failed:`, error);
      
      // Retry logic for network errors
      if (this.retryCount < this.maxRetries && this._isRetryableError(error)) {
        this.retryCount++;
        console.log(`🔄 Retrying ${toolName} (attempt ${this.retryCount}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
        return this.callTool(toolName, params);
      }
      
      this.retryCount = 0;
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  _isRetryableError(error) {
    const retryableErrors = [
      'network',
      'timeout', 
      'fetch',
      'connection',
      'ECONNREFUSED',
      'ENOTFOUND'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return retryableErrors.some(keyword => errorMessage.includes(keyword));
  }

  async _callToolInternal(toolName, params) {
    switch (toolName) {
      case 'loginUser':
        return await this.loginUser(params);
      case 'registerUser':
        return await this.registerUser(params);
      case 'getUserProfile':
        return await this.getUserProfile(params);
      case 'getChats':
        return await this.getMessages(params);
      case 'sendMessage':
        return await this.sendMessage(params);
      case 'getMessages':
        return await this.getMessages(params);
      case 'getQuests':
        return await this.getQuests(params);
      case 'getLeaderboard':
        return await this.getLeaderboard(params);
      case 'getStories':
        return await this.getStories(params);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  // Helper: normalize DB message row to UI shape used by ChatScreen
  _normalizeMessage(row) {
    if (!row) return null;
    return {
      id: row.id,
      message: row.content,
      user_id: row.sender_id,
      username: row.users?.username,
      created_at: row.created_at,
      profiles: {
        username: row.users?.username,
        avatar_url: row.users?.avatar_url
      }
    };
  }

  async _getUserById(userId) {
  if (!this.supabase) return null;
    if (!userId) return null;
    if (this._userCache.has(userId)) return this._userCache.get(userId);
    const { data, error } = await this.supabase
      .from('users')
      .select('id, username, avatar_url')
      .eq('id', userId)
      .single();
    if (!error && data) {
      this._userCache.set(userId, data);
      return data;
    }
    return null;
  }

  // Ensure a default chat exists and return its id
  async _ensureDefaultChat() {
  if (!this.supabase) return null;
    if (this._defaultChatCache) return this._defaultChatCache;
    const name = 'General';
    const { data: existing } = await this.supabase
      .from('chats')
      .select('id')
      .eq('name', name)
      .limit(1)
      .single();
    if (existing?.id) {
      this._defaultChatCache = existing.id;
      return existing.id;
    }
    const { data: created, error } = await this.supabase
      .from('chats')
      .insert([{ name, type: 'public', created_at: new Date().toISOString() }])
      .select('id')
      .single();
    if (error) {
      console.warn('Could not create default chat, proceeding without chat_id:', error.message);
      return null;
    }
    this._defaultChatCache = created.id;
    return created.id;
  }

  async loginUser({ email, password }) {
    try {
      if (!this.supabase) {
        return { success: false, error: 'Backend not configured' };
      }
      // 1) Plain-text login against users table (no hashing)
      const { data: userRow, error: userRowError } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', (email || '').toLowerCase().trim())
        .eq('password', password || '')
        .single();

      if (userRow && !userRowError) {
        const userData = {
          id: userRow.id,
          email: userRow.email,
          username: userRow.username || (email || '').split('@')[0],
          ...userRow
        };
        // No supabase session in plain query; still persist app user for auto-login UX
        try { await SecureStore.setItemAsync('user', JSON.stringify(userData)); } catch {}
        return { success: true, data: userData };
      }

      // 2) Fallback to Supabase Auth password login (if enabled)
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Get user profile
        const { data: profile } = await this.supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const userData = {
          id: data.user.id,
          email: data.user.email,
          username: profile?.username || email.split('@')[0],
          ...profile
        };
        try { await SecureStore.setItemAsync('user', JSON.stringify(userData)); } catch {}

        return { success: true, data: userData };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login exception:', error);
      return { success: false, error: error.message };
    }
  }

  async registerUser({ email, password, username }) {
    try {
      if (!this.supabase) {
        return { success: false, error: 'Backend not configured' };
      }
      // First, sign up the user
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        console.error('Registration error:', error.message);
        return { success: false, error: error.message };
      }

  if (data.user) {
        // Insert/Update user profile WITH plain-text password for compatibility
        const { error: profileError } = await this.supabase
          .from('users')
          .upsert([{
            id: data.user.id,
            username,
            email,
            password, // plain-text as requested
            avatar_url: null,
            created_at: new Date().toISOString()
          }], { onConflict: 'id' });

        if (profileError) {
          console.error('Profile creation error:', profileError.message);
          // Continue anyway, profile might already exist
        }

        const userData = {
          id: data.user.id,
          email: data.user.email,
          username
        };
  try { await SecureStore.setItemAsync('user', JSON.stringify(userData)); } catch {}

        return { success: true, data: userData };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error('Registration exception:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserProfile({ userId }) {
    try {
      if (!this.supabase) {
        return { success: false, error: 'Backend not configured' };
      }
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Profile fetch exception:', error);
      return { success: false, error: error.message };
    }
  }

  async getMessages({ limit = 50 } = {}) {
    try {
      if (!this.supabase) {
        return { success: false, error: 'Backend not configured' };
      }
      const { data, error } = await this.supabase
        .from('messages')
        .select('id, content, sender_id, created_at, users:sender_id (username, avatar_url)')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Messages fetch error:', error.message);
        return { success: false, error: error.message };
      }

      const normalized = (data || []).map(row => this._normalizeMessage(row));
      return { success: true, data: normalized };
    } catch (error) {
      console.error('Messages fetch exception:', error);
      return { success: false, error: error.message };
    }
  }

  async sendMessage({ content, message, userId, chatId }) {
    try {
      if (!this.supabase) {
        return { success: false, error: 'Backend not configured' };
      }
      const text = content ?? message;
      if (!text || !userId) return { success: false, error: 'Missing content or userId' };

      let chat_id = chatId || null;
      if (!chat_id) {
        chat_id = await this._ensureDefaultChat();
      }

      const insertPayload = {
        content: text,
        sender_id: userId,
        created_at: new Date().toISOString()
      };
      if (chat_id) insertPayload.chat_id = chat_id;

      const { data, error } = await this.supabase
        .from('messages')
        .insert([insertPayload])
        .select('id, content, sender_id, created_at, users:sender_id (username, avatar_url)')
        .single();

      if (error) {
        console.error('Send message error:', error.message);
        return { success: false, error: error.message };
      }

      // Reward: +2 trophies, +5 XP (best-effort; ignores failures)
      try {
        await this.supabase.rpc('increment_user_stats', { p_user_id: userId, p_trophies: 2, p_xp: 5 });
      } catch (_) {
        // Fallback: direct update if RPC not present
        try {
          const { data: current } = await this.supabase
            .from('users')
            .select('trophies, xp')
            .eq('id', userId)
            .single();
          await this.supabase
            .from('users')
            .update({ trophies: (current?.trophies ?? 0) + 2, xp: (current?.xp ?? 0) + 5 })
            .eq('id', userId);
        } catch {}
      }

      return { success: true, data: this._normalizeMessage(data) };
    } catch (error) {
      console.error('Send message exception:', error);
      return { success: false, error: error.message };
    }
  }

  // Realtime subscriptions for messages
  subscribeToMessages(callback) {
    try {
  if (!this.supabase) return null;
      if (this._realtimeChannel) return this._realtimeChannel;
      const channel = this.supabase
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
          const row = payload.new;
          let normalized = this._normalizeMessage(row);
          if (!normalized?.profiles?.username) {
            const user = await this._getUserById(row.sender_id);
            if (user) {
              normalized = {
                ...normalized,
                username: user.username,
                profiles: { username: user.username, avatar_url: user.avatar_url }
              };
            }
          }
          callback?.({ new: normalized });
        })
        .subscribe();
      this._realtimeChannel = channel;
      return channel;
    } catch (e) {
      console.warn('Realtime subscribe failed:', e.message);
      return null;
    }
  }

  unsubscribe(channel) {
    try {
      const ch = channel || this._realtimeChannel;
      if (ch) {
        this.supabase.removeChannel(ch);
      }
      this._realtimeChannel = null;
    } catch (e) {
      console.warn('Realtime unsubscribe failed:', e.message);
    }
  }

  async getQuests() {
    try {
      if (!this.supabase) {
        return { success: false, error: 'Backend not configured' };
      }
      const { data, error } = await this.supabase
        .from('quests')
        .select('id, name, description, image_url, trophy_reward, is_active, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) return { success: false, error: error.message };
      const quests = (data || []).map(q => ({
        id: q.id,
        title: q.name,
        description: q.description,
        image_url: q.image_url,
        trophies: q.trophy_reward
      }));
      return { success: true, data: quests };
    } catch (error) {
      console.error('Quests fetch exception:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserQuests({ userId }) {
    try {
      // Compute today's message count
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const { count: msgCount } = await this.supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', userId)
        .gte('created_at', startOfDay);

      // Basic daily quests definition (can be extended)
      const quests = [
        {
          id: 'daily_msg_1',
          title: 'Say Hello',
          description: 'Send 1 message today',
          target: 1,
          reward: 10,
          progress: msgCount ?? 0
        },
        {
          id: 'daily_msg_5',
          title: 'Keep Talking',
          description: 'Send 5 messages today',
          target: 5,
          reward: 25,
          progress: msgCount ?? 0
        }
      ];

      return { success: true, data: quests };
    } catch (error) {
      console.error('getUserQuests exception:', error);
      return { success: false, error: error.message };
    }
  }

  async getLeaderboard() {
    try {
      if (!this.supabase) {
        return { success: false, error: 'Backend not configured' };
      }
      const { data, error } = await this.supabase
        .from('users')
        .select('id, username, trophies, xp')
        .order('trophies', { ascending: false })
        .limit(100);
      if (error) return { success: false, error: error.message };
      const leaderboard = (data || []).map((u, idx) => ({
        id: u.id,
        username: u.username || 'Unknown',
        trophies: u.trophies ?? 0,
        xp: u.xp ?? 0,
        level: Math.floor((u.xp ?? 0) / 1000) + 1,
        rank: idx + 1
      }));
      return { success: true, data: leaderboard };
    } catch (error) {
      console.error('Leaderboard fetch exception:', error);
      return { success: false, error: error.message };
    }
  }

  async getStories() {
    try {
      if (!this.supabase) {
        return { success: false, error: 'Backend not configured' };
      }
      const { data, error } = await this.supabase
        .from('stories')
        .select('id, user_id, content, media_url, created_at, users:user_id (username)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) return { success: false, error: error.message };

      const stories = (data || []).map(s => ({
        id: s.id,
        title: s.content?.slice(0, 24) || 'Story',
        content: s.content,
        author: s.users?.username || 'Unknown',
        likes: 0,
        media_url: s.media_url,
        created_at: s.created_at
      }));

      return { success: true, data: stories };
    } catch (error) {
      console.error('Stories fetch exception:', error);
      return { success: false, error: error.message };
    }
  }
}

const mcpClient = new SupabaseMCPClient();
export default mcpClient;
