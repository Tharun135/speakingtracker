import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { getJournalHistory } from '../utils/storage';

const { width } = Dimensions.get('window');

export default function HistoryScreen({ profile }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [sound, setSound] = useState(null);

  useEffect(() => {
    loadHistory();
    return () => { if (sound) sound.unloadAsync(); };
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const data = await getJournalHistory();
    setHistory(data);
    setLoading(false);
  };

  const playRecording = async (path, id) => {
    try {
      if (sound) await sound.unloadAsync();
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: path },
        { shouldPlay: true }
      );
      setSound(newSound);
      setPlayingId(id);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) setPlayingId(null);
      });
    } catch (e) { console.error('Play Error', e); }
  };

  const renderEntry = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>Fluency</Text>
          <Text style={styles.scoreVal}>{item.score}/10</Text>
        </View>
      </View>
      
      <Text style={styles.transcript} numberOfLines={3}>"{item.transcript}"</Text>
      
      {item.metrics && (
        <View style={styles.metricsStrip}>
          <View style={styles.metricItem}>
             <Text style={styles.metricVal}>{item.metrics.wpm} WPM</Text>
             <Text style={styles.metricLabel}>TEMPO</Text>
          </View>
          <View style={styles.metricItem}>
             <Text style={styles.metricVal}>{item.metrics.pitchVariation}/10</Text>
             <Text style={styles.metricLabel}>PITCH</Text>
          </View>
          <View style={styles.metricItem}>
             <Text style={styles.metricVal}>{item.metrics.pausePattern}</Text>
             <Text style={styles.metricLabel}>PAUSE</Text>
          </View>
        </View>
      )}

      {item.coaching?.targetedTips?.length > 0 && (
        <View style={styles.coachingBrief}>
           <Text style={styles.coachingTitle}>Targeted Tips:</Text>
           {item.coaching.targetedTips.slice(0, 2).map((tip, i) => (
             <Text key={i} style={styles.coachingTip}>• {tip}</Text>
           ))}
        </View>
      )}

      <View style={styles.cardFooter}>
        <TouchableOpacity 
          style={[styles.playBtn, playingId === item.id && styles.playBtnActive]} 
          onPress={() => playRecording(item.audioPath, item.id)}
        >
          <Text style={styles.playBtnText}>{playingId === item.id ? '⏸ PLAYING' : '▶ LISTEN'}</Text>
        </TouchableOpacity>
        
        {item.pronunciation?.trickySounds?.length > 0 && (
          <View style={styles.soundPills}>
            {item.pronunciation.trickySounds.slice(0, 2).map((s, i) => (
              <View key={i} style={styles.soundPill}><Text style={styles.soundPillText}>{s}</Text></View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Growth Journal</Text>
        <Text style={styles.subtitle}>Your 30-day speaking timeline</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No recordings yet. Speak today to start your journal!</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          renderItem={renderEntry}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: 13, color: '#6666AA', fontWeight: '600', marginTop: 4 },
  list: { padding: 16 },
  card: { backgroundColor: '#1A1A2E', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A4A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  date: { color: '#6C63FF', fontWeight: '800', fontSize: 13 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreLabel: { color: '#444466', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  scoreVal: { color: '#fff', fontSize: 14, fontWeight: '800' },
  transcript: { color: '#B0B0D0', fontSize: 14, fontStyle: 'italic', lineHeight: 22, marginBottom: 15 },
  
  metricsStrip: { flexDirection: 'row', backgroundColor: '#1A1A2E', borderRadius: 15, padding: 12, gap: 10, marginBottom: 15 },
  metricItem: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#2A2A4A' },
  metricVal: { color: '#fff', fontSize: 13, fontWeight: '900' },
  metricLabel: { color: '#6C63FF', fontSize: 8, fontWeight: '900', marginTop: 2 },
  
  coachingBrief: { backgroundColor: '#43C6AC11', borderRadius: 12, padding: 10, marginBottom: 15 },
  coachingTitle: { color: '#43C6AC', fontSize: 9, fontWeight: '900', marginBottom: 5 },
  coachingTip: { color: '#B0B0D0', fontSize: 12, marginBottom: 2 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  playBtn: { backgroundColor: '#6C63FF22', borderWidth: 1, borderColor: '#6C63FF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  playBtnActive: { backgroundColor: '#FF658422', borderColor: '#FF6584' },
  playBtnText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  
  soundPills: { flexDirection: 'row', gap: 5 },
  soundPill: { backgroundColor: '#2A2A4A', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  soundPillText: { color: '#FF6584', fontSize: 10, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: '#444466', textAlign: 'center', fontSize: 16, lineHeight: 24 },
});
