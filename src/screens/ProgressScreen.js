import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { getCompletedDays, calculateStreak, getDayAnalyses, getXP } from '../utils/storage';
import { WEEK_SCHEDULE, EXERCISE_TYPES } from '../data/courseData';

export default function ProgressScreen() {
  const [completedDays, setCompletedDays] = useState(new Set());
  const [analyses, setAnalyses] = useState({});
  const [xp, setXp] = useState(0);
  const [playingId, setPlayingId] = useState(null);
  const soundRef = React.useRef(null);

  useFocusEffect(
    useCallback(() => {
      getCompletedDays().then(setCompletedDays);
      getDayAnalyses().then(setAnalyses);
      getXP().then(setXp);
    }, [])
  );

  const streak = calculateStreak(completedDays);
  const total = completedDays.size;
  const pct = Math.round((total / 30) * 100);

  const fluencyPoints = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    score: analyses[i + 1]?.fluencyScore || 0,
    done: completedDays.has(i + 1)
  }));

  const fillerMap = {};
  Object.values(analyses).forEach(ans => {
    ans.fillers?.forEach(f => {
      fillerMap[f.word] = (fillerMap[f.word] || 0) + f.count;
    });
  });
  const topFillers = Object.entries(fillerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const validScores = Object.values(analyses).map(a => a.fluencyScore).filter(Boolean);
  const avgFluency = validScores.length ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1) : 0;

  const typeCount = {};
  WEEK_SCHEDULE.flatMap(w => w.days).forEach(d => {
    if (completedDays.has(d.day)) {
      typeCount[d.type] = (typeCount[d.type] || 0) + 1;
    }
  });

  const playPastRecording = async (day, uri) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        if (playingId === day) { setPlayingId(null); return; }
      }
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      setPlayingId(day);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) setPlayingId(null);
      });
    } catch (e) {
      Alert.alert("Audio Error", "Could not play this recording. It might have been deleted.");
    }
  };

  React.useEffect(() => {
    return () => { if (soundRef.current) soundRef.current.unloadAsync(); };
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Progress</Text>
        <Text style={styles.headerSub}>30-Day Challenge Overview</Text>
      </View>

      <View style={styles.bigCard}>
        <Text style={styles.bigNumber}>{total}<Text style={styles.bigOf}>/30</Text></Text>
        <Text style={styles.bigLabel}>days completed</Text>
        <View style={styles.bigTrackBg}>
          <View style={[styles.bigTrackFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.bigPct}>{pct}% of the challenge done</Text>
      </View>

      {Object.keys(analyses).length > 0 && (
        <View style={styles.aiDashboard}>
          <View style={styles.aiStatsRow}>
             <View style={styles.aiStatSmall}>
                <Text style={styles.aiStatEmoji}>📈</Text>
                <View>
                  <Text style={styles.aiStatVal}>{avgFluency}</Text>
                  <Text style={styles.aiStatLab}>Avg Fluency</Text>
                </View>
             </View>
             <View style={styles.aiStatSmall}>
                <Text style={styles.aiStatEmoji}>🌪️</Text>
                <View>
                  <Text style={styles.aiStatVal}>{Object.values(fillerMap).reduce((a,b) => a+b, 0)}</Text>
                  <Text style={styles.aiStatLab}>Total Fillers</Text>
                </View>
             </View>
          </View>

          <Text style={styles.chartTitle}>Fluency Journey (Last 30 Days)</Text>
          <View style={styles.chartContainer}>
            {fluencyPoints.map((p, i) => (
              <View key={p.day} style={styles.chartBarCol}>
                <View style={[
                  styles.chartBar, 
                  { height: (p.score / 10) * 80 + 2 },
                  p.score > 7 ? { backgroundColor: '#43C6AC' } : p.score > 4 ? { backgroundColor: '#6C63FF' } : { backgroundColor: '#2A2A4A' }
                ]} />
                {i % 5 === 0 && <Text style={styles.chartDayNum}>{p.day}</Text>}
              </View>
            ))}
          </View>

          {topFillers.length > 0 && (
            <View style={styles.fillersBox}>
              <Text style={styles.fillersTitle}>Top Crutch Words</Text>
              <View style={styles.fillersList}>
                {topFillers.map(([word, count]) => (
                  <View key={word} style={styles.fillerBadge}>
                    <Text style={styles.fillerBadgeText}>{word} ({count})</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{streak}</Text>
          <Text style={styles.statLabel}>🔥 Current Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{30 - total}</Text>
          <Text style={styles.statLabel}>📅 Days Left</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{total * 2}</Text>
          <Text style={styles.statLabel}>⏱ Min Spoken</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{Math.max(0, 7 - (new Date().getDay() || 7))}</Text>
          <Text style={styles.statLabel}>📆 Days This Week</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#6C63FF22', borderColor: '#6C63FF' }]}>
          <Text style={[styles.statNum, { color: '#6C63FF' }]}>{xp}</Text>
          <Text style={styles.statLabel}>✨ Total XP</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Achievement Badges</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
        <Badge icon="🔥" label="5 Day Streak" active={streak >= 5} />
        <Badge icon="🎙️" label="First Recording" active={total >= 1} />
        <Badge icon="📚" label="Vocab Master" active={xp >= 500} />
        <Badge icon="⚡" label="Quick Learner" active={xp >= 1000} />
        <Badge icon="🏆" label="30 Day Hero" active={total >= 30} />
      </ScrollView>

      {Object.keys(typeCount).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Exercise Breakdown</Text>
          {Object.entries(typeCount).map(([type, count]) => {
            const info = EXERCISE_TYPES[type] || { color: '#6C63FF', bg: '#EEF0FF' };
            return (
              <View key={type} style={styles.breakdownRow}>
                <Text style={styles.breakdownEmoji}>{type.split(' ')[0]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.breakdownLabel, { color: info.color }]}>{type.split(' ').slice(1).join(' ')}</Text>
                  <View style={styles.breakdownBarBg}>
                    <View style={[styles.breakdownBarFill, { width: `${(count / total) * 100}%`, backgroundColor: info.color }]} />
                  </View>
                </View>
                <Text style={[styles.breakdownCount, { color: info.color }]}>{count}x</Text>
              </View>
            );
          })}
        </>
      )}

      <Text style={styles.sectionTitle}>Weekly Summary</Text>
      {WEEK_SCHEDULE.map(week => {
        const weekDone = week.days.filter(d => completedDays.has(d.day)).length;
        const weekPct = Math.round((weekDone / week.days.length) * 100);
        return (
          <View key={week.week} style={styles.weekCard}>
            <View style={styles.weekHeader}>
              <Text style={styles.weekTitle}>Week {week.week} · {week.theme}</Text>
              <Text style={styles.weekPct}>{weekDone}/{week.days.length}</Text>
            </View>
            <View style={styles.weekBarBg}>
              <View style={[styles.weekBarFill, { width: `${weekPct}%` }]} />
            </View>
            <View style={styles.weekDots}>
              {week.days.map(d => (
                <View
                  key={d.day}
                  style={[styles.weekDot, completedDays.has(d.day) && styles.weekDotDone]}
                />
              ))}
            </View>
          </View>
        );
      })}

      {Object.keys(analyses).length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Speaking Journal</Text>
          <Text style={styles.sectionSub}>Review and replay your past sessions</Text>
          {Object.entries(analyses).sort((a,b) => b[0] - a[0]).map(([day, data]) => (
            <View key={day} style={styles.journalCard}>
               <View style={styles.journalHeader}>
                  <Text style={styles.journalDay}>Day {day}</Text>
                  <View style={styles.journalScoreBadge}>
                     <Text style={styles.journalScoreText}>{data.fluencyScore}/10</Text>
                  </View>
               </View>
               <Text style={styles.journalTranscript} numberOfLines={2}>"{data.transcript}"</Text>
               <TouchableOpacity 
                  style={[styles.journalPlayBtn, playingId === day && { backgroundColor: '#FF6584' }]} 
                  onPress={() => playPastRecording(day, data.audioUri)}
               >
                  <Text style={styles.journalPlayBtnText}>{playingId === day ? '⏹ Stop' : '▶️ Play Recording'}</Text>
               </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {total === 30 && (
        <View style={styles.completionCard}>
          <Text style={styles.completionEmoji}>🏆</Text>
          <Text style={styles.completionTitle}>Challenge Complete!</Text>
          <Text style={styles.completionSub}>
            You spoke in English every day for 30 days.{'\n'}Your word retrieval speed has fundamentally changed.
          </Text>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const Badge = ({ icon, label, active }) => (
  <View style={[styles.badgeItem, !active && styles.badgeInactive]}>
    <Text style={styles.badgeIcon}>{icon}</Text>
    <Text style={styles.badgeLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  headerSub: { color: '#9999CC', fontSize: 13, marginTop: 2 },
  badgeScroll: { paddingHorizontal: 16, gap: 12, marginBottom: 30 },
  badgeItem: { backgroundColor: '#1C1C36', padding: 15, borderRadius: 20, alignItems: 'center', minWidth: 100, borderWidth: 1, borderColor: '#6C63FF' },
  badgeInactive: { opacity: 0.3, borderColor: '#2A2A4A' },
  badgeIcon: { fontSize: 32, marginBottom: 8 },
  badgeLabel: { color: '#fff', fontSize: 10, fontWeight: '800', textAlign: 'center', width: 80 },

  bigCard: {
    marginHorizontal: 16, backgroundColor: '#1A1A2E', borderRadius: 24,
    padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#2A2A4A',
  },
  bigNumber: { color: '#fff', fontSize: 72, fontWeight: '900', lineHeight: 80 },
  bigOf: { color: '#6666AA', fontSize: 36, fontWeight: '400' },
  bigLabel: { color: '#9999CC', fontSize: 14, marginTop: 4, marginBottom: 16 },
  bigTrackBg: { width: '100%', height: 8, backgroundColor: '#2A2A4A', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  bigTrackFill: { height: '100%', backgroundColor: '#6C63FF', borderRadius: 4 },
  bigPct: { color: '#6C63FF', fontSize: 13, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 24 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#1A1A2E', borderRadius: 16,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A4A',
  },
  statNum: { color: '#fff', fontSize: 28, fontWeight: '800' },
  statLabel: { color: '#9999CC', fontSize: 11, marginTop: 4, textAlign: 'center' },

  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginHorizontal: 20, marginBottom: 12 },

  breakdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 12,
  },
  breakdownEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  breakdownLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  breakdownBarBg: { height: 6, backgroundColor: '#2A2A4A', borderRadius: 3, overflow: 'hidden' },
  breakdownBarFill: { height: '100%', borderRadius: 3 },
  breakdownCount: { fontSize: 13, fontWeight: '700', minWidth: 30, textAlign: 'right' },

  weekCard: {
    marginHorizontal: 16, backgroundColor: '#1A1A2E', borderRadius: 16,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A4A',
  },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  weekTitle: { color: '#E0E0FF', fontSize: 14, fontWeight: '600' },
  weekPct: { color: '#6C63FF', fontSize: 14, fontWeight: '700' },
  weekBarBg: { height: 6, backgroundColor: '#2A2A4A', borderRadius: 3, overflow: 'hidden', marginBottom: 10 },
  weekBarFill: { height: '100%', backgroundColor: '#6C63FF', borderRadius: 3 },
  weekDots: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  weekDot: { width: 10, height: 10, borderRadius: 3, backgroundColor: '#2A2A4A' },
  weekDotDone: { backgroundColor: '#6C63FF' },

  completionCard: {
    marginHorizontal: 16, backgroundColor: '#1E1B38', borderRadius: 20,
    padding: 24, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#6C63FF',
  },
  completionEmoji: { fontSize: 48, marginBottom: 12 },
  completionTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  completionSub: { color: '#BBBBEE', fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // AI Dashboard Styles
  aiDashboard: {
    marginHorizontal: 16, backgroundColor: '#1A1A2E', borderRadius: 24,
    padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#2A2A4A',
  },
  aiStatsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  aiStatSmall: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center' },
  aiStatEmoji: { fontSize: 24 },
  aiStatVal: { color: '#fff', fontSize: 18, fontWeight: '800' },
  aiStatLab: { color: '#9999CC', fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },

  chartTitle: { color: '#9999CC', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 16 },
  chartContainer: { 
    height: 100, flexDirection: 'row', alignItems: 'flex-end', 
    justifyContent: 'space-between', marginBottom: 12, 
    borderBottomWidth: 1, borderBottomColor: '#2A2A4A', paddingBottom: 4 
  },
  chartBarCol: { width: 8, alignItems: 'center' },
  chartBar: { width: 6, borderRadius: 3, backgroundColor: '#2A2A4A' },
  chartDayNum: { position: 'absolute', bottom: -18, color: '#444466', fontSize: 9, fontWeight: '700' },

  fillersBox: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#2A2A4A', paddingTop: 16 },
  fillersTitle: { color: '#9999CC', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 10 },
  fillersList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fillerBadge: { backgroundColor: '#2A2A4A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  fillerBadgeText: { color: '#E0E0FF', fontSize: 11, fontWeight: '700' },

  // Journal Styles
  journalCard: { 
    marginHorizontal: 16, backgroundColor: '#1A1A2E', borderRadius: 20, 
    padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A4A' 
  },
  journalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  journalDay: { color: '#fff', fontSize: 16, fontWeight: '800' },
  journalScoreBadge: { backgroundColor: '#6C63FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  journalScoreText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  journalTranscript: { color: '#9999CC', fontSize: 13, fontStyle: 'italic', lineHeight: 20, marginBottom: 16 },
  journalPlayBtn: { backgroundColor: '#2A2A4A', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  journalPlayBtnText: { color: '#E0E0FF', fontSize: 13, fontWeight: '700' },
});
