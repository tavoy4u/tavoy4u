import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Canvas } from '@react-three/fiber';
import { DBZCharacter, JamaicanCharacter, EuropeanCharacter, SailorMoonCharacter } from '../components/CharacterModels';

const classes = [
  {
    id: 'dbz',
    name: 'Saiyan Warrior',
    description: 'Harness the power of Super Saiyan transformation',
    color: '#FF6B00',
    bgColor: 'rgba(255, 107, 0, 0.2)',
  },
  {
    id: 'jamaican',
    name: 'Island Gangster',
    description: 'Street-smart with golden crown authority',
    color: '#228B22',
    bgColor: 'rgba(34, 139, 34, 0.2)',
  },
  {
    id: 'european',
    name: 'Medieval Knight',
    description: 'Noble warrior with royal bloodline',
    color: '#8B4513',
    bgColor: 'rgba(139, 69, 19, 0.2)',
  },
  {
    id: 'sailormoon',
    name: 'Magical Guardian',
    description: 'Channel the power of cosmic magic',
    color: '#FF69B4',
    bgColor: 'rgba(255, 105, 180, 0.2)',
  },
];

function CharacterPreview({ classId, showKing }: { classId: string; showKing: boolean }) {
  const renderCharacter = () => {
    switch (classId) {
      case 'dbz':
        return <DBZCharacter isKing={showKing} position={[0, -0.5, 0]} />;
      case 'jamaican':
        return <JamaicanCharacter isKing={showKing} position={[0, -0.5, 0]} />;
      case 'european':
        return <EuropeanCharacter isKing={showKing} position={[0, -0.5, 0]} />;
      case 'sailormoon':
        return <SailorMoonCharacter isKing={showKing} position={[0, -0.5, 0]} />;
      default:
        return null;
    }
  };

  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 50 }}
      style={{ width: '100%', height: 200 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.3} />
      {renderCharacter()}
    </Canvas>
  );
}

export default function CharacterSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mode = (params.mode as string) || 'american';
  const action = (params.action as string) || 'create';
  
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showKing, setShowKing] = useState(false);

  const handleContinue = () => {
    if (!selectedClass) {
      return;
    }
    
    // Route to player name entry with selected class
    router.push(`/player-name?mode=${mode}&action=${action}&class=${selectedClass}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚔️ Choose Your Class</Text>
        <Text style={styles.subtitle}>Select your warrior type for battle</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {classes.map((classInfo) => (
          <TouchableOpacity
            key={classInfo.id}
            style={[
              styles.classCard,
              { borderColor: classInfo.color },
              selectedClass === classInfo.id && styles.selectedCard,
            ]}
            onPress={() => setSelectedClass(classInfo.id)}
          >
            <View style={[styles.cardHeader, { backgroundColor: classInfo.bgColor }]}>
              <Text style={[styles.className, { color: classInfo.color }]}>
                {classInfo.name}
              </Text>
            </View>

            <View style={styles.previewContainer}>
              <CharacterPreview classId={classInfo.id} showKing={showKing} />
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.description}>{classInfo.description}</Text>
              
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, !showKing && styles.toggleActive]}
                  onPress={() => setShowKing(false)}
                >
                  <Text style={[styles.toggleText, !showKing && styles.toggleTextActive]}>
                    Man
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, showKing && styles.toggleActive]}
                  onPress={() => setShowKing(true)}
                >
                  <Text style={[styles.toggleText, showKing && styles.toggleTextActive]}>
                    King
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {selectedClass === classInfo.id && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedText}>✓ SELECTED</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.continueButton, !selectedClass && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!selectedClass}
        >
          <Text style={styles.buttonText}>
            {selectedClass ? '→ Continue' : 'Select a Class'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1e',
  },
  header: {
    padding: 20,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderBottomWidth: 2,
    borderBottomColor: '#4ECDC4',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  classCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#4ECDC4',
    overflow: 'hidden',
    marginBottom: 16,
  },
  selectedCard: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    transform: [{ scale: 1.02 }],
  },
  cardHeader: {
    padding: 16,
    alignItems: 'center',
  },
  className: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  previewContainer: {
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cardFooter: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  toggleActive: {
    backgroundColor: '#4ECDC4',
  },
  toggleText: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  selectedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFD700',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  selectedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  footer: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#4ECDC4',
  },
  backButton: {
    backgroundColor: '#FF6B6B',
  },
  disabledButton: {
    backgroundColor: '#666666',
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
