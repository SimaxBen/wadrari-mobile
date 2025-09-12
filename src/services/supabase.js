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
