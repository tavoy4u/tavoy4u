import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🏝️ Island Checkers</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 About The Game</Text>
          <Text style={styles.text}>
            Island Checkers is a modern, cross-platform checkers game featuring both American and Jamaican rule sets. 
            Experience the classic strategy game with stunning 3D graphics, featuring custom Dragon Ball Z characters, 
            and compete against players worldwide in real-time multiplayer matches.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Game Features</Text>
          <View style={styles.featureList}>
            <Text style={styles.feature}>• American & Jamaican Checkers modes</Text>
            <Text style={styles.feature}>• Full 3D board with Three.js rendering</Text>
            <Text style={styles.feature}>• Custom DBZ character pieces</Text>
            <Text style={styles.feature}>• Real-time multiplayer with room codes</Text>
            <Text style={styles.feature}>• AI opponent for single-player</Text>
            <Text style={styles.feature}>• Global leaderboard system</Text>
            <Text style={styles.feature}>• Cross-platform (Web, iOS, Android)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍💻 Created By</Text>
          <Text style={styles.creatorName}>Shaune Forrest</Text>
          <Text style={styles.text}>
            Game Designer & Developer
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏢 Gaming Company</Text>
          <Text style={styles.companyName}>CSWP Games</Text>
          <Text style={styles.text}>
            Bringing innovative gaming experiences to players worldwide.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Game Rules</Text>
          <Text style={styles.ruleTitle}>American Checkers:</Text>
          <Text style={styles.text}>
            • Standard 8x8 board with forced captures
            {'\n'}• Kings can move both forward and backward
            {'\n'}• Multi-jump captures required
          </Text>
          <Text style={styles.ruleTitle}>Jamaican Checkers:</Text>
          <Text style={styles.text}>
            • Flying Kings - move multiple squares
            {'\n'}• Backwards Tek - men can capture backward
            {'\n'}• Maximum Tek rule - must capture most pieces
            {'\n'}• Hoof rule - penalty for missing captures
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌟 Special Thanks</Text>
          <Text style={styles.text}>
            Thank you to all players for making Island Checkers a success! 
            Your feedback and support drive us to create better gaming experiences.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.copyright}>© 2025 CSWP Games. All rights reserved.</Text>
          <Text style={styles.trademark}>Island Checkers™</Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#4ECDC4',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 8,
    textAlign: 'center',
  },
  version: {
    fontSize: 16,
    color: '#AAAAAA',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  creatorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
    textAlign: 'center',
  },
  companyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
  },
  featureList: {
    paddingLeft: 8,
  },
  feature: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 28,
  },
  ruleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 12,
    marginBottom: 8,
  },
  footer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#4ECDC4',
    alignItems: 'center',
  },
  copyright: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 8,
  },
  trademark: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: 2,
    borderTopColor: '#4ECDC4',
  },
  backButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
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
