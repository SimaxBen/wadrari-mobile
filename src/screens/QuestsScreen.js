import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { useMCPAuth } from '../context/MCPAuthContext';
import { useTheme } from '../context/ThemeContext';
import mcpClient from '../services/mcpClient';

const QuestsScreen = () => {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useMCPAuth();
  const { theme } = useTheme();

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      const result = await mcpClient.callTool('getUserQuests', { userId: user.id });
      if (result.success) {
        setQuests(result.data || []);
      }
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderQuest = ({ item }) => {
    const progress = Math.min(item.progress / item.target, 1);
    const isCompleted = item.progress >= item.target;

    return (
      <View style={styles.questCard}>
        <View style={styles.questHeader}>
          <Text style={styles.questTitle}>{item.title}</Text>
          <Text style={styles.questReward}>+{item.reward} 🏆</Text>
        </View>
        
        <Text style={styles.questDescription}>{item.description}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progress * 100}%`,
                  backgroundColor: isCompleted ? theme.colors.success : theme.colors.primary 
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {item.progress}/{item.target}
          </Text>
        </View>
        
        {isCompleted && (
          <TouchableOpacity style={styles.claimButton}>
            <Text style={styles.claimButtonText}>Claimed ✓</Text>
          </TouchableOpacity>
        )}
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
    questsList: {
      flex: 1,
      padding: 15,
    },
    questCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 15,
      padding: 20,
      marginBottom: 15,
      borderColor: theme.colors.border,
      borderWidth: 1,
    },
    questHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    questTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    questReward: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.clash.gold,
    },
    questDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 15,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    progressBar: {
      flex: 1,
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      marginRight: 10,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    claimButton: {
      backgroundColor: theme.colors.success,
      borderRadius: 8,
      padding: 10,
      alignItems: 'center',
    },
    claimButtonText: {
      color: 'white',
      fontWeight: 'bold',
    }
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.text }}>Loading quests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quests</Text>
      </View>
      
      <FlatList
        style={styles.questsList}
        data={quests}
        renderItem={renderQuest}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

export default QuestsScreen;
