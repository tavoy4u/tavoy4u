import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface LeaderboardEntry {
  player_name: string;
  wins: number;
  losses: number;
  games_played: number;
  last_played: string;
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/leaderboard`);
      const data = await response.json();
      
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWinRate = (entry: LeaderboardEntry) => {
    if (entry.games_played === 0) return '0%';
    return `${Math.round((entry.wins / entry.games_played) * 100)}%`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadLeaderboard}
        >
          <Text style={styles.refreshText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : leaderboard.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>🎮</Text>
          <Text style={styles.emptySubtext}>No games played yet!</Text>
          <Text style={styles.emptyHint}>Be the first to play and win!</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.rankColumn]}>#</Text>
            <Text style={[styles.headerText, styles.nameColumn]}>Player</Text>
            <Text style={[styles.headerText, styles.winsColumn]}>Wins</Text>
            <Text style={[styles.headerText, styles.lossesColumn]}>Losses</Text>
            <Text style={[styles.headerText, styles.rateColumn]}>Win %</Text>
          </View>

          {leaderboard.map((entry, index) => (
            <View 
              key={index} 
              style={[
                styles.tableRow,
                index === 0 && styles.firstPlace,
                index === 1 && styles.secondPlace,
                index === 2 && styles.thirdPlace,
              ]}
            >
              <Text style={[styles.cellText, styles.rankColumn]}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
              </Text>
              <Text style={[styles.cellText, styles.nameColumn]}>{entry.player_name}</Text>
              <Text style={[styles.cellText, styles.winsColumn]}>{entry.wins}</Text>
              <Text style={[styles.cellText, styles.lossesColumn]}>{entry.losses}</Text>
              <Text style={[styles.cellText, styles.rateColumn]}>{getWinRate(entry)}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 2,
    borderBottomColor: '#4ECDC4',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#AAAAAA',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptySubtext: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 16,
    color: '#AAAAAA',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  firstPlace: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  secondPlace: {
    backgroundColor: 'rgba(192, 192, 192, 0.15)',
    borderWidth: 2,
    borderColor: '#C0C0C0',
  },
  thirdPlace: {
    backgroundColor: 'rgba(205, 127, 50, 0.15)',
    borderWidth: 2,
    borderColor: '#CD7F32',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  cellText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  rankColumn: {
    width: 50,
    textAlign: 'center',
  },
  nameColumn: {
    flex: 1,
  },
  winsColumn: {
    width: 60,
    textAlign: 'center',
  },
  lossesColumn: {
    width: 60,
    textAlign: 'center',
  },
  rateColumn: {
    width: 70,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
