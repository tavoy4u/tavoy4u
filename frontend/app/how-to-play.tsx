import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function HowToPlayScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.title}>📖 How to Play</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Objective</Text>
            <Text style={styles.text}>
              Capture all of your opponent's pieces or block them so they cannot move.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎮 Basic Rules</Text>
            <Text style={styles.text}>
              • Each player starts with 12 pieces{' \n'}
              • Red pieces start at the bottom{' \n'}
              • Black pieces start at the top{' \n'}
              • Pieces move diagonally on dark squares only{' \n'}
              • Regular pieces can only move forward{' \n'}
              • Kings can move in any diagonal direction
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👑 Kings</Text>
            <Text style={styles.text}>
              When a piece reaches the opposite end of the board, it becomes a King! Kings are more powerful and can move both forward and backward.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚔️ Captures</Text>
            <Text style={styles.text}>
              • Jump over opponent pieces to capture them{' \n'}
              • If a capture is available, you MUST take it{' \n'}
              • You can capture multiple pieces in one turn{' \n'}
              • Chain multiple jumps together for combo captures!
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 Winning</Text>
            <Text style={styles.text}>
              Win by capturing all opponent pieces or blocking them so they have no legal moves available.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌐 Multiplayer</Text>
            <Text style={styles.text}>
              • Create a game to get a room code{' \n'}
              • Share the code with your friend{' \n'}
              • They join using the code{' \n'}
              • Play in real-time from anywhere!
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>← Back to Home</Text>
          </TouchableOpacity>

          <View style={styles.spacing} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    backgroundColor: '#45B7D1',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  spacing: {
    height: 40,
  },
});
