import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Alert, Modal, ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import ConfettiCannon from 'react-native-confetti-cannon';
import { analyzeRecording, getDailyMission, getWordOfTheDay } from '../utils/gemini';
import { getCompletedDays, toggleDay, calculateStreak, saveDayAnalysis, getProfile, getMissionState, saveMission, saveToJournal, updateMissionProgress } from '../utils/storage';
import { WEEK_SCHEDULE, EXERCISE_TYPES } from '../data/courseData';
import { KERALA_FESTIVALS } from '../data/culturalData';

const MOTIVATIONAL = [
  "Every word retrieved today is one less frozen tomorrow.",
  "Speak without stopping. Perfection is the enemy.",
  "Your brain is rewiring. Trust the process.",
  "2 minutes. That is all it takes today.",
  "The path from thought to mouth is getting faster.",
];

const RANDOM_TOPICS = [
  "Explain your favorite movie plot badly.",
  "Describe 'Cloud Computing' to a 5-year-old.",
  "What is your most controversial food opinion?",
  "If you had to teach a class on one thing, what would it be?",
  "Describe your perfect vacation day from morning to night.",
  "What's a piece of advice you always remember?",
  "Explain how the internet works to someone from 1950.",
  "What's the hardest technical problem you've ever solved?"
];

export default function HomeScreen({ profile, onLogout }) {
  const [completedDays, setCompletedDays] = useState(new Set());
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mission, setMission] = useState(null);
  const [dailyWord, setDailyWord] = useState(null);

  const [recording, setRecording] = useState();
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [customTopic, setCustomTopic] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedCulturalItem, setSelectedCulturalItem] = useState(null);
  const [showCulturalModal, setShowCulturalModal] = useState(false);
  const [audioUri, setAudioUri] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const timerRef = useRef(null);
  const scrollRef = useRef(null);
  const wordsScrollRef = useRef(null);
  const cultScrollRef = useRef(null);
  const [wordIdx, setWordIdx] = useState(0);
  const [cultIdx, setCultIdx] = useState(0);

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const d = await getCompletedDays();
    setCompletedDays(new Set(d));
    
    let m = await getMissionState();
    const todayStr = new Date().toDateString();
    if (!m || new Date(m.lastUpdated).toDateString() !== todayStr) {
      const profile = await getProfile();
      const newMission = await getDailyMission(profile?.level || 'B2', profile?.interests || []);
      if (newMission) {
        m = await saveMission(newMission);
      }
    }
    setMission(m);

    // Load Daily Word
    const p = await getProfile();
    const word = await getWordOfTheDay(p?.level || 'B2', p?.interests || []);
    setDailyWord(word);
    
    setLoading(false);
  };

  const nextAutoDay = [...WEEK_SCHEDULE].flatMap(w => w.days).find(
    d => !completedDays.has(d.day)
  ) || { day: 30, type: '🏆 Final', topic: 'You finished! Record your final reflection.' };

  const currentDayNum = selectedDay || nextAutoDay.day;
  const today = [...WEEK_SCHEDULE].flatMap(w => w.days).find(d => d.day === currentDayNum) || nextAutoDay;

  useEffect(() => {
    if (!loading && scrollRef.current) {
      const activeIdx = today.day - 1;
      if (activeIdx > 2) {
        // Delay to allow layout measurement
        setTimeout(() => {
          scrollRef.current?.scrollTo({ x: (activeIdx - 2) * 50, animated: true });
        }, 100);
      }
    }
  }, [today.day, loading]);

  const streak = calculateStreak(completedDays);
  const total = completedDays.size;
  const quote = MOTIVATIONAL[total % MOTIVATIONAL.length];
  const exInfo = EXERCISE_TYPES[today.type] || { color: '#6C63FF', bg: '#EEF0FF' };

  const handleMarkDone = async () => {
    const isNowDone = !completedDays.has(today.day);
    const updated = await toggleDay(today.day);
    setCompletedDays(new Set(updated));
    if (isNowDone) {
      setShowConfetti(true);
      // If we finished the selected day, maybe clear it back to auto-mode if it was the next one
      if (selectedDay === today.day) setSelectedDay(null);
    }
  };

  const resetAll = async () => {
    const performReset = async () => {
      setLoading(true);
      try {
        // 1. Clear completed days
        const updated = await toggleDay(-1);
        setCompletedDays(new Set(updated));
        setSelectedDay(null);
        setCustomTopic(null);

        // 2. Clear and fetch fresh Mission
        const p = await getProfile();
        const newM = await getDailyMission(p?.level || 'B2', p?.interests || []);
        if (newM) {
          const savedM = await saveMission(newM);
          setMission(savedM);
        }
      } catch (e) {
        console.error('Reset Error', e);
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Total Reset? This will clear daily progress and fetch a NEW mission.")) {
        await performReset();
      }
      return;
    }

    Alert.alert(
      "Total Reset",
      "This will clear all daily progress and fetch a NEW mission challenge. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset Everything", style: "destructive", onPress: performReset }
      ]
    );
  };

  const activeTopic = customTopic || today.topic;

  const shuffleTopic = () => setCustomTopic(RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)]);

  const startTimer = () => {
    setTimeLeft(120);
    setIsTimerRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    setIsTimerRunning(false);
  };

  const [metering, setMetering] = useState(-160);

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY,
          (status) => { if (status.metering !== undefined) setMetering(status.metering); },
          100
        );
        setRecording(recording);
        startTimer();
      } else { Alert.alert("Microphone permission required."); }
    } catch (err) { console.error(err); }
  }

  async function stopRecording() {
    setRecording(undefined);
    stopTimer();
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setAudioUri(uri);
        const { sound } = await Audio.Sound.createAsync({ uri });
        setSound(sound);
      }
    } catch (error) { console.error(error); }
  }

  async function runAIAnalysis() {
    if (!audioUri) return;
    setAnalyzing(true);
    setShowAnalysisModal(true);
    setAnalysisResult(null); // Reset previous result

    try {
      const result = await analyzeRecording(audioUri);
      
      // Save for Journal
      const journalEntry = await saveToJournal(result, audioUri);
      
      // Fallback if journal entry failed to create
      const audioPathToUse = journalEntry ? journalEntry.audioPath : audioUri;
      
      const analysisWithAudio = { 
        ...result, 
        audioUri: audioPathToUse, 
        timestamp: new Date().toISOString() 
      };
      
      setAnalysisResult(analysisWithAudio);
      
      if (result && typeof result === 'object' && result.fluencyScore) {
        await saveDayAnalysis(today.day, analysisWithAudio);
        
        // Track Mission Progress
        if (mission && mission.word && result.transcript) {
          const lowerTranscript = result.transcript.toLowerCase();
          const lowerWord = mission.word.toLowerCase();
          if (lowerTranscript.includes(lowerWord)) {
            const count = (lowerTranscript.match(new RegExp(lowerWord, 'g')) || []).length;
            const updatedM = await updateMissionProgress(count);
            setMission(updatedM);
            if (updatedM.progress >= updatedM.targetCount) {
               Alert.alert("🚀 Mission Accomplished!", `You used '${mission.word}' ${updatedM.progress} times today!`);
            }
          }
        }
      }
    } catch (e) {
      console.error('runAIAnalysis Error:', e);
      setAnalysisResult({
        transcript: "Recording captured but analysis failed. This can happen with very long recordings or poor connection.",
        fluencyScore: 5,
        pronunciation: { score: 50, feedback: "Keep practicing!", trickySounds: [] },
        coachingTip: "Try a shorter, clearer recording for better AI depth.",
        fillers: [],
        vocabulary: []
      });
    } finally {
      setAnalyzing(false);
    }
  }

  const scrollWords = (dir) => {
    const newIdx = dir === 'next' ? Math.min(2, wordIdx + 1) : Math.max(0, wordIdx - 1);
    setWordIdx(newIdx);
    const scrollAmount = 295; // width + margin
    wordsScrollRef.current?.scrollTo({ x: newIdx * scrollAmount, animated: true });
  };

  const scrollCult = (dir) => {
    const newIdx = dir === 'next' ? Math.min(KERALA_FESTIVALS.length - 1, cultIdx + 1) : Math.max(0, cultIdx - 1);
    setCultIdx(newIdx);
    const scrollAmount = 295; // Same card width as words
    cultScrollRef.current?.scrollTo({ x: newIdx * scrollAmount, animated: true });
  };

  const refreshDailyWords = async () => {
    setLoading(true);
    const p = await getProfile();
    const words = await getWordOfTheDay(p?.level || 'B2', p?.interests || []);
    setDailyWord(words);
    setWordIdx(0);
    wordsScrollRef.current?.scrollTo({ x: 0, animated: false });
    setLoading(false);
  };

  async function playSound() {
    if (sound) {
      setIsPlaying(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => { if (status.didJustFinish) setIsPlaying(false); });
    }
  }

  const renderDailyWords = () => {
    if (!dailyWord || !Array.isArray(dailyWord)) return null;
    return (
      <View style={styles.wordsSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>⭐ Common Everyday Words</Text>
          <View style={styles.arrowControls}>
             <TouchableOpacity onPress={refreshDailyWords} style={styles.refreshBadge}>
                <Text style={styles.refreshText}>🔄 New Set</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={() => scrollWords('prev')} style={[styles.arrowBtn, wordIdx === 0 && { opacity: 0.3 }]}>
                <Text style={styles.arrowText}>←</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={() => scrollWords('next')} style={[styles.arrowBtn, wordIdx === 2 && { opacity: 0.3 }]}>
                <Text style={styles.arrowText}>→</Text>
             </TouchableOpacity>
          </View>
        </View>
        <ScrollView 
          ref={wordsScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={Platform.OS === 'web'} 
          style={styles.wordsScroll}
        >
          {dailyWord.map((item, idx) => (
            <View key={idx} style={styles.wordCard}>
               <View style={styles.wordHeader}>
                  <Text style={styles.wordTitle}>{item.word}</Text>
                  <Text style={styles.wordCefr}>{item.cefr}</Text>
               </View>
               <Text style={styles.wordType}>[{item.type}]</Text>
               <Text style={styles.wordDefinition} numberOfLines={3}>{item.definition}</Text>
               
               <View style={styles.wordDivider} />
               
               <Text style={styles.exampleHeader}>Example:</Text>
               <Text style={styles.wordExample} numberOfLines={2}>
                 "{item.everydaySentences?.[0]?.sentence || 'Keep practicing...'}"
               </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };



  const formatTime = (sec) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />

      {/* Header & Mission */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{profile?.name?.split(' ')[0] || 'Practitioner'}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.profileChip}>
               <Text style={styles.chipAvatar}>👤</Text>
               <Text style={styles.chipName}>{profile?.name?.split(' ')[0] || 'User'}</Text>
            </View>
            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>🚪 Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={resetAll} style={styles.resetBtnCompact}>
              <Text style={styles.resetText}>🔄 Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          ref={scrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.daysTimeline}
          contentContainerStyle={styles.daysTimelineContent}
        >
          {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
            const isCompleted = completedDays.has(day);
            const isActive = currentDayNum === day;
            return (
              <TouchableOpacity 
                key={day} 
                onPress={() => setSelectedDay(day)}
                style={[
                  styles.dayCircle,
                  isCompleted && styles.dayCircleCompleted,
                  isActive && styles.dayCircleActive
                ]}
              >
                <Text style={[
                  styles.dayText,
                  isCompleted && styles.dayTextCompleted,
                  isActive && styles.dayTextActive
                ]}>
                  {isCompleted ? '✓' : day}
                </Text>
                {isActive && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {mission && (
          <View style={styles.missionCard}>
             <View style={styles.missionHeader}>
                <Text style={styles.missionLabel}>🎯 Daily Mission</Text>
                <Text style={styles.missionBadge}>{mission.progress}/{mission.targetCount}</Text>
             </View>
             <Text style={styles.missionWord}>Use "{mission.word}"</Text>
             <Text style={styles.missionContext}>{mission.context}</Text>
             <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(mission.progress / mission.targetCount) * 100}%` }]} />
             </View>
          </View>
        )}
      </View>

      {/* Word of the Day Section */}
      {renderDailyWords()}

      {/* Today's Task Card */}
      <View style={[styles.todayCard, { borderLeftColor: exInfo.color }]}>
        <View style={styles.todayHeader}>
          <View style={[styles.typeBadge, { backgroundColor: exInfo.bg }]}>
            <Text style={[styles.typeText, { color: exInfo.color }]}>{today.type}</Text>
          </View>
          <TouchableOpacity onPress={shuffleTopic} style={styles.shuffleBtn}>
            <Text style={styles.shuffleBtnText}>🎲 New Topic</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.topicText}>{activeTopic}</Text>
        
        <View style={styles.recorderBox}>
          <Text style={[styles.timerText, timeLeft <= 15 && { color: '#FF6584' }]}>{formatTime(timeLeft)}</Text>
          {recording && (
            <View style={styles.visualizerRow}>
              {[1, 2.5, 4, 5, 3, 4.5, 2].map((seed, i) => (
                <View key={i} style={[styles.visualizerBar, { height: 4 + (seed * Math.max(0, (metering + 60) / 60) * 12) }]} />
              ))}
            </View>
          )}
          <View style={styles.recControls}>
            <TouchableOpacity style={[styles.recBtn, recording && styles.recBtnActive]} onPress={recording ? stopRecording : startRecording}>
              <Text style={[styles.recBtnText, recording && { color: '#fff' }]}>{recording ? '⏹ Stop' : '🎙️ Record'}</Text>
            </TouchableOpacity>
            {sound && !recording && (
              <TouchableOpacity style={styles.playBtn} onPress={playSound}>
                <Text style={styles.playBtnText}>{isPlaying ? '🔊 ...' : '▶️ Listen'}</Text>
              </TouchableOpacity>
            )}
          </View>
          {audioUri && !recording && (
            <TouchableOpacity style={styles.analyzeBtn} onPress={runAIAnalysis}>
              <Text style={styles.analyzeBtnText}>✨ Analyze with Gemini AI</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={[styles.markDoneBtn, { backgroundColor: completedDays.has(today.day) ? '#2A2A4A' : exInfo.color }]} onPress={handleMarkDone}>
          <Text style={styles.markDoneBtnText}>{completedDays.has(today.day) ? '✓ Completed' : '✅ Mark as Done'}</Text>
        </TouchableOpacity>
      </View>

      {/* AI Analysis Modal */}
      <Modal visible={showAnalysisModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>✨ AI Coach Report</Text>
            <TouchableOpacity onPress={() => setShowAnalysisModal(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {analyzing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6C63FF" />
                <Text style={styles.loadingText}>Gemini is analyzing...</Text>
              </View>
            ) : (
              <View>
                <View style={styles.scoreRowModal}>
                  <View style={styles.mainScoreCard}>
                    <Text style={styles.scoreValue}>{analysisResult?.fluencyScore || 0}</Text>
                    <Text style={styles.scoreLabel}>Fluency</Text>
                  </View>
                  <View style={styles.sideScoreCard}>
                    <Text style={[styles.scoreValue, { color: '#43C6AC' }]}>{analysisResult?.pronunciation?.score || 0}%</Text>
                    <Text style={styles.scoreLabel}>Pronunciation</Text>
                  </View>
                </View>

                {analysisResult?.pronunciation?.trickySounds?.length > 0 && (
                  <View style={styles.feedbackSection}>
                    <Text style={styles.sectionHeader}>Tricky Sounds</Text>
                    <View style={styles.soundTags}>
                      {analysisResult.pronunciation.trickySounds.map((s, i) => (
                        <View key={i} style={styles.soundTag}><Text style={styles.soundTagText}>{s}</Text></View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.tipCardModal}>
                   <Text style={styles.tipTitleModal}>💡 Coaching Tip</Text>
                   <Text style={styles.tipTextModal}>{analysisResult?.coachingTip}</Text>
                </View>

                <Text style={styles.sectionTitleModal}>Transcript</Text>
                <View style={styles.transcriptCard}>
                  <Text style={styles.transcriptText}>"{analysisResult?.transcript}"</Text>
                </View>

                <View style={styles.gridRow}>
                   <View style={styles.halfCard}>
                      <Text style={styles.cardHeaderSmall}>🌪️ Fillers</Text>
                      {analysisResult?.fillers?.map((f, i) => (
                        <View key={i} style={styles.fillerItem}>
                          <Text style={styles.fillerWord}>{f.word}</Text>
                          <Text style={styles.fillerCount}>{f.count}</Text>
                        </View>
                      ))}
                   </View>
                   <View style={styles.halfCard}>
                      <Text style={styles.cardHeaderSmall}>💎 Upgrades</Text>
                      {analysisResult?.vocabulary?.map((v, i) => (
                        <View key={i} style={styles.vocabItem}><Text style={styles.newWord}>➜ {v.upgrade}</Text></View>
                      ))}
                   </View>
                </View>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Cultural Detail Modal */}
      <Modal visible={showCulturalModal} animationType="fade" transparent={true}>
        <View style={styles.culturalModalOverlay}>
           <View style={[styles.culturalModalContent, { borderTopColor: selectedCulturalItem?.color }]}>
              <View style={styles.culturalModalHeader}>
                 <View>
                    <Text style={[styles.cultType, { color: selectedCulturalItem?.color }]}>{selectedCulturalItem?.type}</Text>
                    <Text style={styles.cultName}>{selectedCulturalItem?.name}</Text>
                 </View>
                 <TouchableOpacity onPress={() => setShowCulturalModal(false)} style={styles.cultClose}>
                    <Text style={styles.cultCloseText}>✕</Text>
                 </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                 <Text style={styles.cultText}>{selectedCulturalItem?.intro}</Text>

                 <Text style={styles.cultSectionTitle}>What it Represents</Text>
                 <Text style={styles.cultText}>{selectedCulturalItem?.represents}</Text>

                 <Text style={styles.cultSectionTitle}>The Main Tradition: {selectedCulturalItem?.mainTradition?.title}</Text>
                 <View style={[styles.traditionBox, { backgroundColor: selectedCulturalItem?.color + '11', borderColor: selectedCulturalItem?.color + '33' }]}>
                    <Text style={[styles.traditionText, { color: selectedCulturalItem?.color }]}>{selectedCulturalItem?.mainTradition?.details}</Text>
                 </View>

                 <Text style={styles.cultSectionTitle}>{selectedCulturalItem?.customs?.title}</Text>
                 <Text style={styles.cultText}>{selectedCulturalItem?.customs?.details}</Text>

                 <Text style={styles.cultSectionTitle}>Other Celebrations</Text>
                 <View style={styles.otherGrid}>
                    {selectedCulturalItem?.others?.map((other, i) => (
                      <View key={i} style={styles.otherItem}>
                         <Text style={[styles.otherName, { color: selectedCulturalItem?.color }]}>• {other.name}</Text>
                         <Text style={styles.otherDetail}>{other.detail}</Text>
                      </View>
                    ))}
                 </View>

                 <Text style={styles.cultSectionTitle}>In Simple Terms</Text>
                 <View style={styles.simpleSummaryBox}>
                    <Text style={styles.summaryText}>{selectedCulturalItem?.simpleTerms}</Text>
                 </View>
                 
                 <View style={{ height: 40 }} />
              </ScrollView>
           </View>
        </View>
      </Modal>

      {showConfetti && Platform.OS !== 'web' && (
        <ConfettiCannon count={100} origin={{ x: -10, y: 0 }} autoStart={true} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  greeting: { color: '#B0B0D0', fontSize: 12, fontWeight: '700' },
  userName: { color: '#fff', fontSize: 22, fontWeight: '900' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  
  profileChip: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C36', 
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, gap: 8,
    borderWidth: 1, borderColor: '#6C63FF33' 
  },
  chipAvatar: { fontSize: 14 },
  chipName: { color: '#fff', fontSize: 13, fontWeight: '800' },

  logoutBtn: { backgroundColor: '#1A1A2E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#2A2A4A', flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoutText: { color: '#B0B0D0', fontSize: 12, fontWeight: '700' },

  resetBtnCompact: { backgroundColor: '#FF658422', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#FF658444' },
  resetText: { color: '#FF6584', fontSize: 12, fontWeight: '800' },
  
  streakCard: { backgroundColor: '#1C1C36', padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, borderWidth: 1, borderColor: '#2A2A4A' },
  streakEmoji: { fontSize: 24 },
  streakValue: { color: '#fff', fontWeight: '900', fontSize: 16 },
  streakSub: { color: '#9999CC', fontSize: 12 },
  
  missionCard: { backgroundColor: '#1C1C36', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#6C63FF33' },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  missionLabel: { color: '#6C63FF', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  missionBadge: { color: '#fff', fontSize: 12, fontWeight: '800' },
  missionWord: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  missionContext: { color: '#9999CC', fontSize: 11, marginBottom: 15 },
  progressBar: { height: 6, backgroundColor: '#0F0F1A', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6C63FF' },

  wordsSection: { marginBottom: 25 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  sectionLabel: { color: '#B0B0D0', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  wordCountBadge: { color: '#43C6AC', fontSize: 10, fontWeight: '900' },
  wordsScroll: { paddingLeft: 20 },
  wordCard: { width: 280, backgroundColor: '#1C1C36', borderRadius: 24, padding: 20, marginRight: 15, borderWidth: 1, borderColor: '#43C6AC33' },
  wordHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  wordTitle: { color: '#fff', fontSize: 20, fontWeight: '900', flex: 1 },
  wordCefr: { color: '#43C6AC', fontSize: 10, fontWeight: '900', opacity: 0.6, marginLeft: 10 },
  wordType: { color: '#9999CC', fontSize: 11, fontStyle: 'italic', marginBottom: 8 },
  wordDefinition: { color: '#B0B0D0', fontSize: 13, lineHeight: 18, marginBottom: 12, height: 54 },
  wordDivider: { height: 1, backgroundColor: '#2A2A4A', marginBottom: 12 },
  exampleHeader: { color: '#43C6AC', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 },
  wordExample: { color: '#9999CC', fontSize: 12, fontStyle: 'italic', lineHeight: 17 },

  arrowControls: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  arrowBtn: {
    backgroundColor: '#1C1C36',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#43C6AC33',
  },
  arrowControls: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  arrowBtn: {
    backgroundColor: '#1C1C36',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#43C6AC33',
  },
  arrowText: {
    color: '#43C6AC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshBadge: {
    backgroundColor: 'rgba(67, 198, 172, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(67, 198, 172, 0.2)',
  },
  refreshText: {
    color: '#43C6AC',
    fontSize: 11,
    fontWeight: '800',
  },

  todayCard: { marginHorizontal: 16, backgroundColor: '#1A1A2E', borderRadius: 24, padding: 20, borderLeftWidth: 4, marginBottom: 20, borderWidth: 1, borderColor: '#2A2A4A' },
  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeText: { fontWeight: '800', fontSize: 12 },
  shuffleBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  shuffleBtnText: { color: '#6666AA', fontWeight: '800', fontSize: 12 },
  topicText: { color: '#fff', fontSize: 17, lineHeight: 26, marginBottom: 20, fontWeight: '600' },
  recorderBox: { backgroundColor: '#0F0F1A', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 20 },
  timerText: { color: '#fff', fontSize: 42, fontWeight: '900', marginBottom: 15 },
  visualizerRow: { flexDirection: 'row', height: 40, gap: 5, marginBottom: 15, alignItems: 'center' },
  visualizerBar: { width: 3, backgroundColor: '#6C63FF', borderRadius: 2 },
  recControls: { flexDirection: 'row', gap: 15 },
  recBtn: { backgroundColor: '#6C63FF', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15 },
  recBtnActive: { backgroundColor: '#FF6584' },
  recBtnText: { color: '#fff', fontWeight: '800' },
  playBtn: { backgroundColor: '#2A2A4A', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15 },
  playBtnText: { color: '#fff', fontWeight: '700' },
  analyzeBtn: { marginTop: 15, backgroundColor: '#43C6AC', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 15 },
  analyzeBtnText: { color: '#0F0F1A', fontWeight: '800' },
  markDoneBtn: { paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  markDoneBtnText: { color: '#fff', fontWeight: '800' },

  modalContainer: { flex: 1, backgroundColor: '#0F0F1A' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#2A2A4A' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  modalClose: { padding: 5 },
  modalCloseText: { color: '#6C63FF', fontSize: 18, fontWeight: '800' },
  modalBody: { padding: 20 },
  scoreRowModal: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  mainScoreCard: { flex: 1, backgroundColor: '#6C63FF', borderRadius: 20, padding: 15, alignItems: 'center' },
  sideScoreCard: { flex: 1, backgroundColor: '#1C1C36', borderRadius: 20, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A4A' },
  scoreValue: { color: '#fff', fontSize: 28, fontWeight: '900' },
  scoreLabel: { color: '#9999CC', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },
  feedbackSection: { marginBottom: 20 },
  sectionHeader: { color: '#6C63FF', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 10 },
  soundTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  soundTag: { backgroundColor: '#FF658422', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  soundTagText: { color: '#FF6584', fontWeight: '800', fontSize: 12 },
  tipCardModal: { backgroundColor: '#43C6AC11', borderLeftWidth: 4, borderLeftColor: '#43C6AC', padding: 15, borderRadius: 12, marginBottom: 20 },
  tipTitleModal: { color: '#43C6AC', fontSize: 11, fontWeight: '900', marginBottom: 4 },
  tipTextModal: { color: '#E0E0FF', fontSize: 13, lineHeight: 20 },
  sectionTitleModal: { color: '#9999CC', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 10 },
  transcriptCard: { backgroundColor: '#1C1C36', padding: 15, borderRadius: 15, marginBottom: 20 },
  transcriptText: { color: '#B0B0D0', fontSize: 14, fontStyle: 'italic', lineHeight: 22 },
  gridRow: { flexDirection: 'row', gap: 12 },
  halfCard: { flex: 1, backgroundColor: '#1C1C36', borderRadius: 15, padding: 15 },
  cardHeaderSmall: { color: '#fff', fontSize: 12, fontWeight: '800', marginBottom: 10 },
  fillerItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  fillerWord: { color: '#9999CC', fontSize: 12 },
  fillerCount: { color: '#FF6584', fontWeight: '800', fontSize: 12 },
  vocabItem: { marginBottom: 6 },
  newWord: { color: '#43C6AC', fontSize: 12, fontWeight: '700' },
  loadingContainer: { paddingTop: 60, alignItems: 'center' },
  loadingText: { color: '#9999CC', marginTop: 15 },
  
  daysTimeline: { marginBottom: 20, marginTop: 5 },
  daysTimelineContent: { paddingRight: 20 },
  dayCircle: { 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    backgroundColor: '#1C1C36', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12, 
    borderWidth: 1, 
    borderColor: '#2A2A4A',
    position: 'relative'
  },
  dayCircleCompleted: { 
    backgroundColor: '#6C63FF', 
    borderColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ scale: 0.95 }]
  },
  dayCircleActive: { 
    borderColor: '#6C63FF', 
    borderWidth: 2, 
    backgroundColor: '#1C1C36',
    transform: [{ scale: 1.1 }]
  },
  dayText: { color: '#9999CC', fontSize: 13, fontWeight: '800' },
  dayTextCompleted: { color: '#fff', fontSize: 16, fontWeight: '900' },
  dayTextActive: { color: '#fff' },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6C63FF'
  },
  scrollContent: {
    paddingBottom: 110,
  },
  resetBtn: {
    backgroundColor: '#1C1C36',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A4A'
  },
  resetBtnText: {
    color: '#9999CC',
    fontSize: 12,
    fontWeight: '700'
  },

  culturalModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20
  },
  culturalModalContent: {
    backgroundColor: '#1C1C36',
    borderRadius: 30,
    padding: 25,
    maxHeight: '80%',
    borderTopWidth: 5,
    borderWidth: 1,
    borderColor: '#2A2A4A'
  },
  culturalModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20
  },
  cultType: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  cultName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4
  },
  cultClose: {
    backgroundColor: '#2A2A4A',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cultCloseText: {
    color: '#fff',
    fontSize: 16
  },
  cultSectionTitle: {
    color: '#6C63FF',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: 0.5
  },
  cultText: {
    color: '#B0B0D0',
    fontSize: 15,
    lineHeight: 24
  },
  traditionBox: {
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 5
  },
  traditionText: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic'
  },
  elementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5
  },
  elementTag: {
    backgroundColor: '#2A2A4A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12
  },
  elementTagText: {
    color: '#E0E0FF',
    fontSize: 13,
    fontWeight: '600'
  },
  infoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 5
  },
  infoBadgeText: {
    fontSize: 11,
    fontWeight: '800'
  },
  otherGrid: {
    marginTop: 5,
    gap: 12
  },
  otherItem: {
    backgroundColor: '#0F0F1A',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A4A'
  },
  otherName: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4
  },
  otherDetail: {
    color: '#9999CC',
    fontSize: 12,
    lineHeight: 18
  },
  simpleSummaryBox: {
    backgroundColor: '#6C63FF11',
    padding: 15,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF',
    marginTop: 5
  },
  summaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 20
  }
});

