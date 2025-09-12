import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import mcpClient from '../services/mcpClient';

const LeaderboardScreen = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const result = await mcpClient.callTool('getLeaderboard', {});
      if (result.success) {
        setLeaderboard(result.data || []);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPlayer = ({ item, index }) => {
    const getRankIcon = (rank) => {
      switch (rank) {
        case 1: return '🥇';
        case 2: return '🥈';
        case 3: return '🥉';
        default: return `#${rank}`;
      }
    };

    return (
      <View style={[
        styles.playerCard,
        index < 3 && styles.topThreeCard
      ]}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>{getRankIcon(index + 1)}</Text>
        </View>
        
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{item.username}</Text>
          <Text style={styles.playerLevel}>Level {item.level}</Text>
        </View>
        
        <View style={styles.trophyContainer}>
          <Text style={styles.trophyCount}>{item.trophies}</Text>
          <Text style={styles.trophyIcon}>🏆</Text>
        </View>
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
    leaderboardList: {
      flex: 1,
      padding: 15,
    },
    playerCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 15,
      padding: 15,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: theme.colors.border,
      borderWidth: 1,
    },
    topThreeCard: {
      borderColor: theme.colors.clash.gold,
      borderWidth: 2,
    },
    rankContainer: {
      width: 50,
      alignItems: 'center',
    },
    rankText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    playerInfo: {
      flex: 1,
      marginLeft: 15,
    },
    playerName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    playerLevel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    trophyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    trophyCount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.clash.gold,
      marginRight: 5,
    },
    trophyIcon: {
      fontSize: 20,
    }
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.text }}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
      </View>
      
      <FlatList
        style={styles.leaderboardList}
        data={leaderboard}
        renderItem={renderPlayer}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

export default LeaderboardScreen;
