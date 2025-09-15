import { createClient } from '@supabase/supabase-js';

// Safe base64 encoding - handle potential import issues
let base64Encode;
try {
  const base64Module = require('react-native-base64');
  base64Encode = base64Module.encode;
} catch (error) {
  // Fallback to native Buffer if react-native-base64 fails
  base64Encode = (str) => {
    try {
      return Buffer.from(str, 'utf8').toString('base64');
    } catch (bufferError) {
      // Last resort: manual base64 encoding
      return btoa(str);
    }
  };
}

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

// Plain-text mode: do not hash passwords in mobile app (per project decision)

// Login with username and password
export const loginWithUsername = async (username, password) => {
  try {    
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    // Query users table directly
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim())
  .eq('password', password)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Invalid username or password');
      }
      throw new Error('Database connection failed');
    }
    
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Update last activity - don't fail if this fails
    try {
      await supabase
        .from('users')
        .update({ 
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    } catch (updateError) {
      // Ignore update errors
    }

    return {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      trophies: user.trophies || 0,
      seasonal_trophies: user.seasonal_trophies || 0,
      total_messages: user.total_messages || 0,
      total_stories: user.total_stories || 0,
      current_streak: user.current_streak || 0,
      badges: user.badges || [],
      created_at: user.created_at,
      last_activity: user.last_activity
    };
  } catch (error) {
    throw error;
  }
};

// Test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
      
    if (error) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};
