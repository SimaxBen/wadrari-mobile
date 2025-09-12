import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useMCPAuth } from '../context/MCPAuthContext';
import { useTheme } from '../context/ThemeContext';
import mcpClient from '../services/mcpClient';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, profile } = useMCPAuth();
  const { theme } = useTheme();
  const flatListRef = useRef();
  const subscriptionRef = useRef();

  useEffect(() => {
    loadMessages();
    setupRealtimeSubscription();
    
    return () => {
      if (subscriptionRef.current) {
        mcpClient.unsubscribe(subscriptionRef.current);
      }
    };
  }, []);

  const loadMessages = async () => {
    try {
      const result = await mcpClient.callTool('getChats', { userId: user.id });
      if (result.success) {
        setMessages(result.data || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    subscriptionRef.current = mcpClient.subscribeToMessages((payload) => {
      console.log('New message received:', payload);
      const newMessage = payload.new;
      setMessages(prev => [...prev, newMessage]);
      // Auto scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageToSend = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    // Optimistic update
    const tempMessage = {
      id: `temp-${Date.now()}`,
      message: messageToSend,
      user_id: user.id,
      username: profile?.username || user.username,
      created_at: new Date().toISOString(),
      profiles: {
        username: profile?.username || user.username,
        avatar_url: profile?.avatar_url || profile?.avatar
      }
    };

    setMessages(prev => [...prev, tempMessage]);

    try {
      const result = await mcpClient.callTool('sendMessage', {
        userId: user.id,
        message: messageToSend,
        username: profile?.username || user.username
      });

      if (!result.success) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        Alert.alert('Error', 'Failed to send message');
      } else {
        // Replace temp message with real one
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempMessage.id ? result.data : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.user_id === user.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <Text style={styles.username}>
            {item.profiles?.username || item.username || 'Anonymous'}
          </Text>
        )}
        <Text style={[
          styles.messageText,
          { color: isOwnMessage ? 'white' : theme.colors.text }
        ]}>
          {item.message}
        </Text>
        <Text style={[
          styles.timestamp,
          { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary }
        ]}>
          {new Date(item.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.primary,
      padding: 20,
      paddingTop: 50,
      alignItems: 'center',
    },
    headerTitle: {
      color: 'white',
      fontSize: 20,
      fontWeight: 'bold',
    },
    messagesList: {
      flex: 1,
      padding: 10,
    },
    messageContainer: {
      maxWidth: '80%',
      marginVertical: 5,
      padding: 10,
      borderRadius: 15,
    },
    ownMessage: {
      alignSelf: 'flex-end',
      backgroundColor: theme.colors.primary,
    },
    otherMessage: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
    },
    username: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    messageText: {
      fontSize: 16,
      marginBottom: 4,
    },
    timestamp: {
      fontSize: 12,
      alignSelf: 'flex-end',
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 10,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
    },
    textInput: {
      flex: 1,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginRight: 10,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    sendButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    sendButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
    sendButtonDisabled: {
      backgroundColor: theme.colors.textSecondary,
    }
  });

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat Room</Text>
      </View>
      
      <FlatList
        ref={flatListRef}
        style={styles.messagesList}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (loading || !newMessage.trim()) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={loading || !newMessage.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
