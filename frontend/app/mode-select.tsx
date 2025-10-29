import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ModeSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = params.mode as string; // 'american' or 'jamaican'

  const isJamaican = mode === 'jamaican';

  return (
    <View style={styles.container}>
      <View style={styles.gradient}>
        <View style={styles.content}>
          <Text style={styles.flag}>{isJamaican ? '🇯🇲' : '🇺🇸'}</Text>
          <Text style={styles.title}>
            {isJamaican ? 'Jamaican Checkers' : 'American Checkers'}
          </Text>
          
          {isJamaican && (
            <View style={styles.rulesCard}>
              <Text style={styles.rulesTitle}>Jamaican Rules:</Text>
              <Text style={styles.rulesText}>
                👑 Flying Kings - Kings move multiple squares{'\n'}
                ⬅️ Backwards Tek - All pieces tek backwards{'\n'}
                🔗 Multiple Tek - Chain multiple teks in one turn{'\n'}
                🎯 Maximum Tek - Must tek the most pieces{'\n'}
                🐴 Hoof Rule - Miss a tek? Piece removed!
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.aiButton]}
              onPress={() => router.push(`/class-select?mode=${mode}&type=single&is3d=true`)}
            >
              <Text style={styles.buttonText}>🤖 Play vs Computer (3D)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={() => router.push(`/create-game?mode=${mode}`)}
            >
              <Text style={styles.buttonText}>🎮 Create Game</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.push(`/join-game?mode=${mode}`)}
            >
              <Text style={styles.buttonText}>🌴 Join Game</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.backButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.buttonText}>← Back</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  flag: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  rulesCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    width: '100%',
  },
  rulesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  rulesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 28,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  aiButton: {
    backgroundColor: '#9B59B6',
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
  },
  secondaryButton: {
    backgroundColor: '#4ECDC4',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
