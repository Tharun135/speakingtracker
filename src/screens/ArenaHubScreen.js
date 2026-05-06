import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ArenaHubScreen({ navigation }) {
  const modes = [
    { name: 'Voice Lab', desc: 'AI-powered pitch & pace analysis', icon: '🧪', screen: 'Lab', color: ['#6C63FF', '#4B42E6'] },
    { name: 'Shadowing', desc: 'Train with professional speakers', icon: '📜', screen: 'Shadow', color: ['#FF6B6B', '#E64B4B'] },
    { name: 'Speak Better', desc: 'Improve clarity & pronunciation', icon: '💬', screen: 'Better', color: ['#4ECDC4', '#3EBBB2'] },
    { name: 'Interview Prep', desc: 'Prepare for job simulations', icon: '👔', screen: 'Interview', color: ['#FFD93D', '#EBA000'] },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>The Arena</Text>
        <Text style={styles.subtitle}>Choose your training mode today</Text>
      </View>

      <View style={styles.grid}>
        {modes.map((m) => (
          <TouchableOpacity 
            key={m.name} 
            style={styles.card}
            onPress={() => navigation.navigate(m.screen)}
          >
            <LinearGradient colors={m.color} style={styles.iconBox}>
              <Text style={styles.icon}>{m.icon}</Text>
            </LinearGradient>
            <View style={styles.textCol}>
              <Text style={styles.cardTitle}>{m.name}</Text>
              <Text style={styles.cardDesc}>{m.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  header: { paddingTop: 60, paddingHorizontal: 24, marginBottom: 30 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900' },
  subtitle: { color: '#B0B0D0', fontSize: 13, marginTop: 4 },
  grid: { paddingHorizontal: 16, gap: 15 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#1A1A2E', 
    borderRadius: 24, 
    padding: 16, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A4A'
  },
  iconBox: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  icon: { fontSize: 28 },
  textCol: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  cardDesc: { color: '#6666AA', fontSize: 12, marginTop: 2 },
});
