import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Dimensions, 
  TouchableOpacity, StatusBar, SafeAreaView, ActivityIndicator,
  Animated, Platform, Alert
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { SPEAKER_STYLES } from '../data/styleGymData';
import { analyzeRecording } from '../utils/gemini';
import { addXP } from '../utils/storage';

const { width } = Dimensions.get('window');

export default function ShadowingScreen({ navigation }) {
  const [activeStyle, setActiveStyle] = useState(SPEAKER_STYLES[0]);
  const [activeScript, setActiveScript] = useState(SPEAKER_STYLES[0].scripts[0]);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [isPlayingRef, setIsPlayingRef] = useState(false);

  // Animation for metrics
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (report) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [report]);

  const toggleRecording = async () => {
    try {
      if (isRecording) {
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        processAnalysis(uri);
      } else {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') return;
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(recording);
        setIsRecording(true);
        setReport(null);
        fadeAnim.setValue(0);
      }
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  const processAnalysis = async (uri) => {
    setAnalyzing(true);
    try {
      // Analyze user against the active speaker profile
      const result = await analyzeRecording(uri, activeStyle.profile);
      setReport(result);
      await addXP(25);
    } catch (e) {
      Alert.alert("Coach is Offline", "Couldn't analyze your speech. Check connection.");
    } finally {
      setAnalyzing(false);
    }
  };

  const playReference = () => {
    if (isPlayingRef) {
      Speech.stop();
      setIsPlayingRef(false);
      return;
    }
    setIsPlayingRef(true);
    // Simulate podcast audio using TTS with style-matched settings
    Speech.speak(activeScript.content.replace(/\//g, ''), {
      rate: activeStyle.profile.wpm / 150, // Normalized
      pitch: activeStyle.id === 'ENTREPRENEUR' ? 1.1 : 0.9,
      onDone: () => setIsPlayingRef(false),
      onError: () => setIsPlayingRef(false)
    });
  };

  const renderMetric = (label, value, icon) => (
    <View style={styles.metricCard}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={styles.metricVal}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
           <Text style={styles.title}>Style Gym</Text>
           <Text style={styles.subtitle}>Master professional delivery</Text>
        </View>

        {/* Style Selection */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.styleList}
          contentContainerStyle={{ gap: 12, paddingRight: 20 }}
        >
          {SPEAKER_STYLES.map((style) => (
            <TouchableOpacity 
              key={style.id} 
              onPress={() => {
                setActiveStyle(style);
                setActiveScript(style.scripts[0]);
                setReport(null);
              }}
              style={[styles.styleCard, activeStyle.id === style.id && styles.activeStyleCard]}
            >
              <Text style={styles.styleEmoji}>{style.emoji}</Text>
              <Text style={[styles.styleName, activeStyle.id === style.id && styles.activeStyleName]}>{style.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Active Style Profile Info */}
        <View style={styles.profileBox}>
           <Text style={styles.profileTag}>TARGET STYLE: {activeStyle.profile.vibe}</Text>
           <Text style={styles.profileDesc}>{activeStyle.description}</Text>
           <View style={styles.profileStats}>
              <Text style={styles.profileStat}>🎯 {activeStyle.profile.wpm} WPM</Text>
              <Text style={styles.profileStat}>📉 {activeStyle.profile.pitchRange} range</Text>
           </View>
        </View>

        {/* Script Area */}
        <View style={styles.scriptArea}>
           <View style={styles.scriptHeader}>
              <Text style={styles.scriptBadge}>PRACTICE SCRIPT</Text>
              <TouchableOpacity onPress={playReference} style={[styles.listenBtn, isPlayingRef && styles.listenBtnActive]}>
                 <Text style={styles.listenText}>{isPlayingRef ? '⏹ Stop' : '🔊 Listen'}</Text>
              </TouchableOpacity>
           </View>
           <Text style={styles.scriptContent}>{activeScript.content}</Text>
           {activeScript.instruction && (
             <View style={styles.tipBox}>
                <Text style={styles.tipText}>💡 {activeScript.instruction}</Text>
             </View>
           )}
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          onPress={toggleRecording} 
          style={[styles.mainBtn, isRecording && styles.mainBtnActive]}
          disabled={analyzing}
        >
           {analyzing ? (
             <ActivityIndicator color="#fff" />
           ) : (
             <Text style={styles.mainBtnText}>{isRecording ? '⏹ FINISH DRILL' : '🎙️ START DRILL'}</Text>
           )}
        </TouchableOpacity>

        {/* Analytics Report */}
        {report && (
          <Animated.View style={[styles.reportContainer, { opacity: fadeAnim }]}>
            <Text style={styles.reportHeader}>Gym Analytics</Text>
            
            <View style={styles.metricsRow}>
              {renderMetric('Tempo', report.metrics?.wpm || '---', '⚡')}
              {renderMetric('Pause', report.metrics?.pausePattern || '---', '⏸')}
              {renderMetric('Pitch', `${report.metrics?.pitchVariation || 0}/10`, '〽️')}
            </View>

            {/* Simple Visualizer Mockup */}
            <View style={styles.vizContainer}>
              <Text style={styles.vizLabel}>PITCH VARIATION MAP</Text>
              <View style={styles.vizBars}>
                {[...Array(15)].map((_, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.vizBar, 
                      { height: 10 + Math.random() * (report.metrics?.pitchVariation * 4 || 10) }
                    ]} 
                  />
                ))}
              </View>
            </View>

            <View style={styles.coachCard}>
               <Text style={styles.coachTag}>COACH'S NOTES</Text>
               <Text style={styles.coachSummary}>{report.coaching?.speedFeedback || report.coachingTip}</Text>
               
               {report.coaching?.targetedTips?.map((tip, i) => (
                 <View key={i} style={styles.tipItem}>
                    <Text style={styles.tipDot}>•</Text>
                    <Text style={styles.tipLine}>{tip}</Text>
                 </View>
               ))}
            </View>

            <View style={styles.transCard}>
               <Text style={styles.transLabel}>YOUR TRANSCRIPT</Text>
               <Text style={styles.transText}>"{report.transcript}"</Text>
            </View>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  scroll: { padding: 20 },
  header: { marginBottom: 25 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: '#6C63FF', fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },
  
  styleList: { marginBottom: 20 },
  styleCard: { 
    backgroundColor: '#1A1A2E', paddingHorizontal: 20, paddingVertical: 15, 
    borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A4A', width: 140
  },
  activeStyleCard: { backgroundColor: '#6C63FF22', borderColor: '#6C63FF' },
  styleEmoji: { fontSize: 24, marginBottom: 8 },
  styleName: { color: '#B0B0D0', fontWeight: '800', fontSize: 13, textAlign: 'center' },
  activeStyleName: { color: '#fff' },

  profileBox: { backgroundColor: '#1A1A2E', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#2A2A4A' },
  profileTag: { color: '#6C63FF', fontSize: 10, fontWeight: '900', marginBottom: 12, letterSpacing: 1 },
  profileDesc: { color: '#B0B0D0', fontSize: 14, lineHeight: 22, marginBottom: 15 },
  profileStats: { flexDirection: 'row', gap: 15 },
  profileStat: { color: '#fff', fontSize: 12, fontWeight: '700', backgroundColor: '#0F0F1A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },

  scriptArea: { backgroundColor: '#1C1C36', borderRadius: 24, padding: 25, marginBottom: 25, borderWidth: 1, borderColor: '#6C63FF33' },
  scriptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  scriptBadge: { color: '#43C6AC', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  listenBtn: { backgroundColor: '#1A1A2E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, borderColor: '#6C63FF' },
  listenBtnActive: { backgroundColor: '#FF658422', borderColor: '#FF6584' },
  listenText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  scriptContent: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 36, textAlign: 'center' },
  tipBox: { marginTop: 20, padding: 12, backgroundColor: '#0F0F1A', borderRadius: 15 },
  tipText: { color: '#6C63FF', fontSize: 13, fontWeight: '600', fontStyle: 'italic', textAlign: 'center' },

  mainBtn: { 
    backgroundColor: '#6C63FF', paddingVertical: 20, borderRadius: 25, 
    alignItems: 'center', shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, marginBottom: 30
  },
  mainBtnActive: { backgroundColor: '#FF6584' },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  reportContainer: { marginTop: 10 },
  reportHeader: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 20 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  metricCard: { flex: 1, backgroundColor: '#1A1A2E', borderRadius: 20, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A4A' },
  metricIcon: { fontSize: 20, marginBottom: 8 },
  metricVal: { color: '#fff', fontSize: 14, fontWeight: '900', marginBottom: 4 },
  metricLabel: { color: '#444466', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },

  vizContainer: { backgroundColor: '#1A1A2E', borderRadius: 20, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#2A2A4A' },
  vizLabel: { color: '#444466', fontSize: 8, fontWeight: '900', marginBottom: 12, letterSpacing: 1 },
  vizBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4, height: 50 },
  vizBar: { width: 4, backgroundColor: '#6C63FF', borderRadius: 2 },

  coachCard: { backgroundColor: '#43C6AC11', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#43C6AC33', marginBottom: 20 },
  coachTag: { color: '#43C6AC', fontSize: 10, fontWeight: '900', marginBottom: 12, letterSpacing: 1 },
  coachSummary: { color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 22, marginBottom: 15 },
  tipItem: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  tipDot: { color: '#43C6AC', fontWeight: '900' },
  tipLine: { color: '#B0B0D0', fontSize: 13, flex: 1 },

  transCard: { backgroundColor: '#1A1A2E', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#2A2A4A' },
  transLabel: { color: '#444466', fontSize: 9, fontWeight: '900', marginBottom: 10 },
  transText: { color: '#B0B0D0', fontSize: 14, fontStyle: 'italic', lineHeight: 22 }
});

