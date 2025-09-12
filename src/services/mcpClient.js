// Enhanced MCP Client for React Native with better error handling
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
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

// Initialize Supabase client with React Native specific options
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: null, // We'll handle storage manually with SecureStore
    autoRefreshToken: true,
    persistSession: false, // We'll handle this manually
    detectSessionInUrl: false
  }
});

class SupabaseMCPClient {
  constructor() {
    this.supabase = supabase;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    console.log('🔧 Initializing MCP Client for React Native...');
  }

  async testConnection() {
    try {
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

  async loginUser({ email, password }) {
    try {
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
        const { data: profile, error: profileError } = await this.supabase
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
        // Insert user profile
        const { error: profileError } = await this.supabase
          .from('users')
          .insert([{
            id: data.user.id,
            username,
            email,
            avatar_url: null,
            created_at: new Date().toISOString()
          }]);

        if (profileError) {
          console.error('Profile creation error:', profileError.message);
          // Continue anyway, profile might already exist
        }

        const userData = {
          id: data.user.id,
          email: data.user.email,
          username
        };

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
      const { data, error } = await this.supabase
        .from('messages')
        .select(`
          *,
          users(username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Messages fetch error:', error.message);
        return { success: false, error: error.message };
      }

      // Reverse to show oldest first
      const messages = data.reverse().map(msg => ({
        id: msg.id,
        content: msg.content,
        user_id: msg.user_id,
        username: msg.users?.username || 'Unknown',
        avatar_url: msg.users?.avatar_url,
        created_at: msg.created_at
      }));

      return { success: true, data: messages };
    } catch (error) {
      console.error('Messages fetch exception:', error);
      return { success: false, error: error.message };
    }
  }

  async sendMessage({ content, userId }) {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .insert([{
          content,
          user_id: userId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Send message error:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Send message exception:', error);
      return { success: false, error: error.message };
    }
  }

  async getQuests() {
    try {
      // Return mock quests for now
      const mockQuests = [
        {
          id: '1',
          title: 'Welcome to Wadrari',
          description: 'Send your first message in the chat',
          xp: 100,
          completed: false
        },
        {
          id: '2', 
          title: 'Social Butterfly',
          description: 'Send 5 messages in the chat',
          xp: 250,
          completed: false
        },
        {
          id: '3',
          title: 'Story Teller',
          description: 'View the Stories section',
          xp: 150,
          completed: false
        }
      ];

      return { success: true, data: mockQuests };
    } catch (error) {
      console.error('Quests fetch exception:', error);
      return { success: false, error: error.message };
    }
  }

  async getLeaderboard() {
    try {
      // Return mock leaderboard for now
      const mockLeaderboard = [
        { id: '1', username: 'ChampionUser', xp: 2500, rank: 1 },
        { id: '2', username: 'ProPlayer', xp: 2100, rank: 2 },
        { id: '3', username: 'RisingStar', xp: 1800, rank: 3 },
        { id: '4', username: 'NewcomerHero', xp: 1200, rank: 4 },
        { id: '5', username: 'ChatMaster', xp: 950, rank: 5 }
      ];

      return { success: true, data: mockLeaderboard };
    } catch (error) {
      console.error('Leaderboard fetch exception:', error);
      return { success: false, error: error.message };
    }
  }

  async getStories() {
    try {
      // Return mock stories for now
      const mockStories = [
        {
          id: '1',
          title: 'The Legend of Wadrari',
          content: 'Long ago, in a digital realm, warriors gathered to share tales and compete for glory...',
          author: 'StoryMaster',
          likes: 42,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'First Victory',
          content: 'My journey began with a simple quest, but it led to the greatest adventure of my life...',
          author: 'AdventureSeeker',
          likes: 28,
          created_at: new Date().toISOString()
        }
      ];

      return { success: true, data: mockStories };
    } catch (error) {
      console.error('Stories fetch exception:', error);
      return { success: false, error: error.message };
    }
  }
}

const mcpClient = new SupabaseMCPClient();
export default mcpClient;
