import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import mcpClient from '../services/mcpClient';
import { notifyNewStory } from '../services/notifications';

const StoriesScreen = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const result = await mcpClient.callTool('getStories', {});
      if (result.success) {
        setStories(result.data || []);
        // Simple notify of latest story (one-shot) to verify notifications work
        if ((result.data || []).length > 0) {
          const latest = result.data[0];
          notifyNewStory({ author: latest.author, title: latest.title });
        }
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStory = ({ item }) => (
    <TouchableOpacity style={styles.storyCard}>
      <Text style={styles.storyTitle}>{item.title}</Text>
      <Text style={styles.storyContent}>{item.content}</Text>
      
      <View style={styles.storyFooter}>
        <Text style={styles.storyAuthor}>By {item.author}</Text>
        <View style={styles.storyStats}>
          <Text style={styles.storyLikes}>❤️ {item.likes}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
    storiesList: {
      flex: 1,
      padding: 15,
    },
    storyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 15,
      padding: 20,
      marginBottom: 15,
      borderColor: theme.colors.border,
      borderWidth: 1,
    },
    storyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 10,
    },
    storyContent: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 15,
      lineHeight: 20,
    },
    storyFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    storyAuthor: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    storyStats: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    storyLikes: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    }
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.text }}>Loading stories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stories</Text>
      </View>
      
      <FlatList
        style={styles.storiesList}
        data={stories}
        renderItem={renderStory}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

export default StoriesScreen;
