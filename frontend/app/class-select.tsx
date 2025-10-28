import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const PIECE_CLASSES = [
  {
    id: 'jamaican',
    name: 'Jamaican Warriors',
    flag: '🇯🇲',
    manIcon: '🏝️',
    kingIcon: '👑',
    description: 'Tropical island fighters with vibrant energy',
    color: '#FFD700',
  },
  {
    id: 'european',
    name: 'European Knights',
    flag: '⚔️',
    manIcon: '🛡️',
    kingIcon: '♔',
    description: 'Medieval warriors with honor and strength',
    color: '#4169E1',
  },
  {
    id: 'dbz',
    name: 'Dragon Ball Z',
    flag: '🐉',
    manIcon: '⚡',
    kingIcon: '💫',
    description: 'Super Saiyans and powerful fighters',
    color: '#FF8C00',
  },
  {
    id: 'sailormoon',
    name: 'Sailor Moon',
    flag: '🌙',
    manIcon: '✨',
    kingIcon: '🌟',
    description: 'Magical guardians of love and justice',
    color: '#FF69B4',
  },
];

export default function ClassSelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = params.mode as string;
  const gameType = params.type as string; // 'single' or 'multi'
  
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
  };

  const handleContinue = () => {
    if (!selectedClass) {
      Alert.alert('Select a Class', 'Please choose your piece class before continuing.');
      return;
    }

    if (gameType === 'single') {
      router.push(`/single-player-${mode}?class=${selectedClass}`);
    } else {
      // For multiplayer, pass class to create/join game
      router.push(`/mode-select?mode=${mode}&class=${selectedClass}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.gradient}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.title}>⚔️ Choose Your Class</Text>
          <Text style={styles.subtitle}>Select your game piece design</Text>

          <View style={styles.classGrid}>
            {PIECE_CLASSES.map((pieceClass) => (
              <TouchableOpacity
                key={pieceClass.id}
                style={[
                  styles.classCard,
                  selectedClass === pieceClass.id && styles.selectedCard,
                  { borderColor: pieceClass.color }
                ]}
                onPress={() => handleClassSelect(pieceClass.id)}
              >
                <Text style={styles.classFlag}>{pieceClass.flag}</Text>
                <Text style={styles.className}>{pieceClass.name}</Text>
                
                <View style={styles.previewRow}>
                  <View style={styles.previewItem}>
                    <Text style={styles.previewIcon}>{pieceClass.manIcon}</Text>
                    <Text style={styles.previewLabel}>Man</Text>
                  </View>
                  <View style={styles.previewItem}>
                    <Text style={styles.previewIcon}>{pieceClass.kingIcon}</Text>
                    <Text style={styles.previewLabel}>King</Text>
                  </View>
                </View>

                <Text style={styles.classDescription}>{pieceClass.description}</Text>

                {selectedClass === pieceClass.id && (
                  <View style={[styles.selectedBadge, { backgroundColor: pieceClass.color }]}>
                    <Text style={styles.selectedBadgeText}>✓ SELECTED</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.continueButton,
                !selectedClass && styles.disabledButton
              ]}
              onPress={handleContinue}
              disabled={!selectedClass}
            >
              <Text style={styles.buttonText}>
                {selectedClass ? '✓ Continue with Selection' : 'Select a Class First'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.backButton]}
              onPress={() => router.back()}
            >
              <Text style={styles.buttonText}>← Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Placeholder designs shown. Custom 2D character models coming soon!
            </Text>
          </View>
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
    backgroundColor: '#2C3E50',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.8,
  },
  classGrid: {
    gap: 16,
  },
  classCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ccc',
  },
  selectedCard: {
    borderWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  classFlag: {
    fontSize: 48,
    marginBottom: 12,
  },
  className: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 16,
  },
  previewItem: {
    alignItems: 'center',
  },
  previewIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  classDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  selectedBadge: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 32,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  disabledButton: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoBox: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  infoText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
