import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PlayerNameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = (params.mode as string) || 'american';
  const action = (params.action as string) || 'create'; // 'create' or 'join'
  const selectedClass = (params.class as string) || 'dbz';
  
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    
    try {
      // Save player name for future use
      await AsyncStorage.setItem('playerName', playerName.trim());
      
      // Route based on action with class
      if (action === 'create') {
        router.push(`/create-game?mode=${mode}&playerName=${encodeURIComponent(playerName.trim())}&class=${selectedClass}`);
      } else {
        router.push(`/join-game?mode=${mode}&playerName=${encodeURIComponent(playerName.trim())}&class=${selectedClass}`);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save name');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🎮 Enter Your Name</Text>
        
        <Text style={styles.subtitle}>
          {action === 'create' ? 'You are creating a game' : 'You are joining a game'}
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter your player name"
            placeholderTextColor="#999"
            value={playerName}
            onChangeText={setPlayerName}
            maxLength={20}
            autoFocus
            autoCapitalize="words"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton, loading && styles.disabledButton]} 
            onPress={handleContinue}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '⏳ Loading...' : '✓ Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4ECDC4',
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
    backgroundColor: '#4ECDC4',
  },
  secondaryButton: {
    backgroundColor: '#FF6B6B',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
