// Debug test for authentication
import { encode as base64Encode } from 'react-native-base64';

// Test the base64 encoding function
export const testPasswordHashing = (password) => {
  console.log('Testing password hashing...');
  console.log('Input password:', password);
  
  const saltedPassword = password + 'salt';
  console.log('Salted password:', saltedPassword);
  
  const hashedPassword = base64Encode(saltedPassword);
  console.log('Hashed password:', hashedPassword);
  
  return hashedPassword;
};

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    const { supabase } = await import('./supabase');
    console.log('Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);
    
    console.log('Supabase test result:', { data, error });
    return !error;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
};
