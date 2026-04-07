import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveProfile, addXP } from '../utils/storage';

export default function OnboardingScreen({ onFinish }) {
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState('B1');
  const [interests, setInterests] = useState([]);
  const [goals, setGoals] = useState('10 min/day');

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const interestOptions = ['Sports', 'Travel', 'Business', 'Tech', 'Movies', 'Food', 'Art'];
  const goalOptions = ['5 min/day', '10 min/day', '30 min/day', 'Fluent Focus'];

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleFinish = async () => {
    await saveProfile({ level, interests, goals });
    await addXP(100); // 100 bonus XP for completing onboarding
    onFinish();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.steps}>Step {step} of 3</Text>
        
        {step === 1 && (
          <View>
            <Text style={styles.title}>What's your proficiency level?</Text>
            <Text style={styles.subtitle}>Don't worry, you can change this later.</Text>
            <View style={styles.grid}>
              {levels.map(l => (
                <TouchableOpacity 
                  key={l} 
                  style={[styles.chip, level === l && styles.chipActive]} 
                  onPress={() => setLevel(l)}
                >
                  <Text style={[styles.chipText, level === l && styles.chipTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.title}>What are your interests?</Text>
            <Text style={styles.subtitle}>We'll personalize your practice topics.</Text>
            <View style={styles.grid}>
              {interestOptions.map(i => (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.chip, interests.includes(i) && styles.chipActive]} 
                  onPress={() => toggleInterest(i)}
                >
                  <Text style={[styles.chipText, interests.includes(i) && styles.chipTextActive]}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.title}>Set your daily goal</Text>
            <Text style={styles.subtitle}>Consistency is key to fluency.</Text>
            <View style={styles.gridVertical}>
              {goalOptions.map(g => (
                <TouchableOpacity 
                  key={g} 
                  style={[styles.chipFull, goals === g && styles.chipActive]} 
                  onPress={() => setGoals(g)}
                >
                  <Text style={[styles.chipText, goals === g && styles.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.nextBtn} 
            onPress={step === 3 ? handleFinish : () => setStep(step + 1)}
          >
            <Text style={styles.nextBtnText}>{step === 3 ? 'Get Started' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  scroll: { padding: 30, flex: 1 },
  steps: { color: '#6C63FF', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', marginBottom: 10 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', lineHeight: 32, marginBottom: 10 },
  subtitle: { color: '#B0B0D0', fontSize: 16, marginBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridVertical: { gap: 10 },
  chip: { backgroundColor: '#1C1C36', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 15, minWidth: 80, alignItems: 'center' },
  chipFull: { backgroundColor: '#1C1C36', paddingHorizontal: 20, paddingVertical: 20, borderRadius: 15, width: '100%' },
  chipActive: { backgroundColor: '#6C63FF', borderColor: '#817AFF', borderWidth: 1 },
  chipText: { color: '#B0B0D0', fontWeight: '700', fontSize: 16 },
  chipTextActive: { color: '#fff' },
  footer: { flexDirection: 'row', marginTop: 'auto', paddingTop: 50, gap: 15 },
  backBtn: { paddingVertical: 18, flex: 1, alignItems: 'center' },
  backBtnText: { color: '#B0B0D0', fontWeight: '700', fontSize: 16 },
  nextBtn: { backgroundColor: '#6C63FF', paddingVertical: 18, borderRadius: 18, flex: 2, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
