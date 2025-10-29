import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CreateGameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = (params.mode as string) || 'american';
  const playerClass = (params.class as string) || 'jamaican';
  
  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    createRoom();
  }, []);

  const createRoom = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/create-room?mode=${mode}&red_class=${playerClass}&black_class=${playerClass}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.room_code) {
        setRoomCode(data.room_code);
      } else {
        setError('Failed to create room');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my Island Checkers game! Room Code: ${roomCode}`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartGame = () => {
    router.push(`/game-3d?room=${roomCode}&color=red&mode=${mode}&class=${playerClass}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.gradient}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Creating game room...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.gradient}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={createRoom}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.gradient}>
        <View style={styles.content}>
          <Text style={styles.title}>🎮 Game Room Created!</Text>
          
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Room Code:</Text>
            <Text style={styles.code}>{roomCode}</Text>
          </View>

          <Text style={styles.instructions}>
            Share this code with your opponent to start playing!
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={handleStartGame}
            >
              <Text style={styles.buttonText}>🏝️ Enter Game Room</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={handleShare}
            >
              <Text style={styles.buttonText}>📤 Share Code</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.tertiaryButton]} 
              onPress={() => router.back()}
            >
              <Text style={styles.buttonTextDark}>← Back to Home</Text>
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
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
  },
  codeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 32,
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  codeLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  code: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B6B',
    letterSpacing: 4,
  },
  instructions: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.9,
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
  primaryButton: {
    backgroundColor: '#45B7D1',
  },
  secondaryButton: {
    backgroundColor: '#4ECDC4',
  },
  tertiaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonTextDark: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
});
