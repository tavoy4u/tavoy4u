import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import SpaceBackground from '../components/SpaceBackground';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Animated Space Background */}
      <SpaceBackground />
      
      {/* Content overlay */}
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>🏝️ Island</Text>
            <Text style={styles.titleMain}>CHECKERS</Text>
            <Text style={styles.subtitle}>Tropical Adventure Edition</Text>
          </View>

          {/* Mode Selection */}
          <View style={styles.modeContainer}>
            <Text style={styles.modeTitle}>Choose Your Style</Text>
            
            <View style={styles.modeButtons}>
              <TouchableOpacity 
                style={[styles.modeCard, styles.americanCard]}
                onPress={() => router.push('/mode-select?mode=american')}
              >
                <Text style={styles.modeFlag}>🇺🇸</Text>
                <Text style={styles.modeCardTitle}>American</Text>
                <Text style={styles.modeCardDesc}>Classic Rules</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modeCard, styles.jamaicanCard]}
                onPress={() => router.push('/mode-select?mode=jamaican')}
              >
                <Text style={styles.modeFlag}>🇯🇲</Text>
                <Text style={styles.modeCardTitle}>Jamaican</Text>
                <Text style={styles.modeCardDesc}>Flying Kings</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.push('/leaderboard')}
            >
              <Text style={styles.buttonText}>🏆 Leaderboard</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.push('/about')}
            >
              <Text style={styles.buttonText}>ℹ️ About Game</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>Multiplayer • Cross-Platform • Real-time</Text>
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
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  titleMain: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 8,
  },
  modeContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 32,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  modeCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  americanCard: {
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  jamaicanCard: {
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  modeFlag: {
    fontSize: 48,
    marginBottom: 12,
  },
  modeCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modeCardDesc: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
  tertiaryButton: {
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonTextDark: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  footer: {
    marginTop: 40,
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});
