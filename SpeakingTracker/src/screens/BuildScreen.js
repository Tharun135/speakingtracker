import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getPhaseSteps, togglePhaseStep } from '../utils/storage';
import { PHASES } from '../data/courseData';

export default function BuildScreen({ navigation }) {
  const [phaseSteps, setPhaseSteps] = useState({});
  const [expanded, setExpanded] = useState(null);

  useFocusEffect(
    useCallback(() => {
      getPhaseSteps().then(setPhaseSteps);
    }, [])
  );

  const getPhaseProgress = (phaseId, totalSteps) => {
    const done = phaseSteps[phaseId]?.size || 0;
    return { done, total: totalSteps, pct: totalSteps > 0 ? done / totalSteps : 0 };
  };

  const handleToggleStep = async (phaseId, stepIndex) => {
    const updated = await togglePhaseStep(phaseId, stepIndex);
    setPhaseSteps({ ...updated });
  };

  const overallDone = PHASES.reduce((acc, p) => acc + (phaseSteps[p.id]?.size || 0), 0);
  const overallTotal = PHASES.reduce((acc, p) => acc + p.steps.length, 0);
  const overallPct = overallTotal > 0 ? overallDone / overallTotal : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Build Guide</Text>
        <Text style={styles.headerSub}>All 4 phases — in order</Text>
      </View>

      {/* Overall Progress */}
      <View style={styles.overallCard}>
        <View style={styles.overallRow}>
          <Text style={styles.overallLabel}>Overall Progress</Text>
          <Text style={styles.overallPct}>{Math.round(overallPct * 100)}%</Text>
        </View>
        <View style={styles.trackBg}>
          <Animated.View style={[styles.trackFill, { width: `${Math.round(overallPct * 100)}%`, backgroundColor: '#6C63FF' }]} />
        </View>
        <Text style={styles.overallSub}>{overallDone} of {overallTotal} steps completed</Text>
      </View>

      {/* Phase Cards */}
      <Text style={styles.sectionTitle}>Phases</Text>
      {PHASES.map((phase, idx) => {
        const { done, total, pct } = getPhaseProgress(phase.id, phase.steps.length);
        const isOpen = expanded === phase.id;
        const isComplete = done === total;

        return (
          <View key={phase.id} style={styles.phaseCard}>
            {/* Phase Header */}
            <TouchableOpacity
              style={styles.phaseHeader}
              onPress={() => setExpanded(isOpen ? null : phase.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.phaseIconWrap, { backgroundColor: phase.color + '22' }]}>
                <Text style={styles.phaseIcon}>{phase.icon}</Text>
              </View>
              <View style={styles.phaseInfo}>
                <View style={styles.phaseTopRow}>
                  <Text style={styles.phaseNum}>Phase {phase.number}</Text>
                  {isComplete && <Text style={styles.completeBadge}>✓ Complete</Text>}
                </View>
                <Text style={styles.phaseTitle}>{phase.title}</Text>
                <Text style={styles.phaseSub}>{phase.subtitle}</Text>
              </View>
              <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {/* Progress bar */}
            <View style={styles.progressWrap}>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: phase.color }]} />
              </View>
              <Text style={[styles.progressPct, { color: phase.color }]}>{done}/{total}</Text>
            </View>

            {/* Steps (expanded) */}
            {isOpen && (
              <View style={styles.stepsContainer}>
                {phase.steps.map((step, si) => {
                  const done = phaseSteps[phase.id]?.has(si) || false;
                  return (
                    <TouchableOpacity
                      key={si}
                      style={styles.stepRow}
                      onPress={() => handleToggleStep(phase.id, si)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.stepCheck, done && { backgroundColor: phase.color, borderColor: phase.color }]}>
                        {done && <Text style={styles.stepCheckMark}>✓</Text>}
                      </View>
                      <Text style={[styles.stepText, done && styles.stepTextDone]}>{step}</Text>
                    </TouchableOpacity>
                  );
                })}

                {/* Phase nav */}
                <View style={styles.phaseNavRow}>
                  {idx < PHASES.length - 1 && (
                    <TouchableOpacity
                      style={[styles.nextPhaseBtn, { backgroundColor: PHASES[idx + 1].color }]}
                      onPress={() => setExpanded(PHASES[idx + 1].id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.nextPhaseBtnText}>
                        Next: Phase {PHASES[idx + 1].number} — {PHASES[idx + 1].title} →
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        );
      })}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  headerSub: { color: '#9999CC', fontSize: 13, marginTop: 2 },

  overallCard: {
    marginHorizontal: 16, backgroundColor: '#1A1A2E', borderRadius: 20,
    padding: 18, marginBottom: 24, borderWidth: 1, borderColor: '#2A2A4A',
  },
  overallRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  overallLabel: { color: '#E0E0FF', fontSize: 14, fontWeight: '600' },
  overallPct: { color: '#6C63FF', fontSize: 14, fontWeight: '800' },
  trackBg: { height: 8, backgroundColor: '#2A2A4A', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  trackFill: { height: '100%', borderRadius: 4 },
  overallSub: { color: '#6666AA', fontSize: 12 },

  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginHorizontal: 20, marginBottom: 12 },

  phaseCard: {
    marginHorizontal: 16, backgroundColor: '#1A1A2E', borderRadius: 20,
    marginBottom: 14, borderWidth: 1, borderColor: '#2A2A4A', overflow: 'hidden',
  },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  phaseIconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  phaseIcon: { fontSize: 22 },
  phaseInfo: { flex: 1 },
  phaseTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  phaseNum: { color: '#9999CC', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  completeBadge: { color: '#43C6AC', fontSize: 11, fontWeight: '700', backgroundColor: '#1E3830', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  phaseTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  phaseSub: { color: '#9999CC', fontSize: 12, marginTop: 2 },
  chevron: { color: '#6666AA', fontSize: 12 },

  progressWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, gap: 10 },
  progressBg: { flex: 1, height: 6, backgroundColor: '#2A2A4A', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressPct: { fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'right' },

  stepsContainer: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#2A2A4A', paddingTop: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  stepCheck: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#3A3A5A',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1,
  },
  stepCheckMark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  stepText: { color: '#C0C0E0', fontSize: 14, lineHeight: 22, flex: 1 },
  stepTextDone: { color: '#6666AA', textDecorationLine: 'line-through' },

  phaseNavRow: { marginTop: 8 },
  nextPhaseBtn: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  nextPhaseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
