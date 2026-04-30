import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Animated, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { getWordOfTheDay, evaluateActiveRecall, analyzeRecording, getPhrasalChunks } from '../utils/gemini';
import { getVocabBank, addToVocabBank, getProfile, getSRSData, updateSRS, getStuckWords, markAsStuck, removeFromStuck, getChunks, addXP, getFavorites, toggleFavorite } from '../utils/storage';
import { NATURAL_CHUNKS } from '../data/naturalChunks';
import { speak, stopSpeech } from '../utils/speech';

const { width } = Dimensions.get('window');
const DRILL_STAGES = { IDLE: 'IDLE', FLASH: 'FLASH', RECALL: 'RECALL', CHECKING: 'CHECKING', FEEDBACK: 'FEEDBACK' };

export default function VocabScreen({ profile }) {
  const [loading, setLoading] = useState(true);
  const [wordDay, setWordDay] = useState(null);
  const [stuckWords, setStuckWords] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [shuffledChunks, setShuffledChunks] = useState([]);
  const [activeCat, setActiveCat] = useState('All');
  const [fetchingMore, setFetchingMore] = useState(false);
  
  // Drill State
  const [stage, setStage] = useState(DRILL_STAGES.IDLE);
  const [currentDrillWord, setCurrentDrillWord] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Voice Recall State
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const categories = ['All', '❤️', ...new Set(NATURAL_CHUNKS.map(w => w.cat))];
  const filteredChunks = activeCat === 'All' 
    ? shuffledChunks 
    : activeCat === '❤️' 
      ? shuffledChunks.filter(w => favorites.includes(w.word))
      : shuffledChunks.filter(w => w.cat === activeCat);

  useEffect(() => {
    loadInitialData();
    return () => stopSpeech();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    const shuffled = [...NATURAL_CHUNKS].sort(() => Math.random() - 0.5);
    setShuffledChunks(shuffled);
    const profile = await getProfile();
    const word = await getWordOfTheDay(profile?.level || 'B2', profile?.interests || []);
    setWordDay(word && word.length > 0 ? word[0] : null);
    const stuck = await getStuckWords();
    setStuckWords(stuck);
    const favs = await getFavorites();
    setFavorites(favs);
    setLoading(false);
  };

  const shuffleChunks = () => {
    const shuffled = [...shuffledChunks].sort(() => Math.random() - 0.5);
    setShuffledChunks(shuffled);
  };

  const handleToggleFav = async (word) => {
    const next = await toggleFavorite(word);
    setFavorites(next);
  };

  const handleFetchMore = async () => {
    setFetchingMore(true);
    try {
      const more = await getPhrasalChunks(activeCat === 'All' || activeCat === '❤️' ? 'Daily Life' : activeCat);
      if (more && more.length > 0) {
        setShuffledChunks(prev => [...prev, ...more]);
      } else {
        Alert.alert("Busy Coach", "Gemini is a bit busy. Please try again in a few seconds.");
      }
    } catch (e) {
      console.error(e);
    }
    setFetchingMore(false);
  };

  const startDrill = (wordData) => {
    setCurrentDrillWord(wordData);
    setStage(DRILL_STAGES.FLASH);
    setUserInput('');
    setAiResult(null);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start(() => setStage(DRILL_STAGES.RECALL));
  };

  const handleVoiceRecall = async () => {
    try {
      if (isRecording) {
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setTranscribing(true);
        const result = await analyzeRecording(uri);
        setUserInput(result.transcript);
        setTranscribing(false);
      } else {
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status === 'granted') {
          await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
          const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
          setRecording(recording);
          setIsRecording(true);
        }
      }
    } catch (e) { console.error(e); setTranscribing(false); }
  };

  const handleSubmitRecall = async () => {
    if (!userInput.trim()) return;
    setStage(DRILL_STAGES.CHECKING);
    const result = await evaluateActiveRecall(currentDrillWord.word, userInput);
    setAiResult(result);
    setStage(DRILL_STAGES.FEEDBACK);
    
    if (result && result.correct) {
      await addXP(30);
      await updateSRS(currentDrillWord.word, 5);
      await removeFromStuck(currentDrillWord.word);
    } else {
      await markAsStuck(currentDrillWord);
    }
    const updatedStuck = await getStuckWords();
    setStuckWords(updatedStuck);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      {stage === DRILL_STAGES.IDLE ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.header}>Natural Vocabulary</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {categories.map(c => (
              <TouchableOpacity key={c} style={[styles.catBtn, activeCat === c && styles.catBtnActive]} onPress={() => setActiveCat(c)}>
                <Text style={[styles.catText, activeCat === c && styles.catTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {activeCat === 'All' && wordDay && (
            <View style={styles.cardHighlight}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>🌟 WORD OF THE DAY</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={styles.badgeLabel}>{wordDay.cefr}</Text>
                  <TouchableOpacity onPress={() => handleToggleFav(wordDay.word)}>
                    <Text style={{ fontSize: 18 }}>{favorites.includes(wordDay.word) ? '❤️' : '🤍'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.wordRow}>
                <Text style={styles.wordBig}>{wordDay.word}</Text>
                <TouchableOpacity onPress={() => speak(wordDay.word)} style={styles.speakBtnTiny}>
                  <Text style={styles.speakIcon}>🔊</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.wtype}>{wordDay.type}</Text>
              <Text style={styles.def}>{wordDay.definition}</Text>
              <TouchableOpacity style={styles.drillBtn} onPress={() => startDrill(wordDay)}>
                <Text style={styles.drillBtnText}>Start Active Drill</Text>
              </TouchableOpacity>
            </View>
          )}

          {stuckWords.length > 0 && (
            <View style={styles.stuckSection}>
              <Text style={styles.secLabel}>Needs Practice</Text>
              {stuckWords.map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.stuckCard} onPress={() => startDrill(item)}>
                  <View style={{flex: 1}}>
                    <Text style={styles.stuckWord}>{item.word}</Text>
                    <Text style={styles.stuckAttempts}>Drilled {item.attempts} times</Text>
                  </View>
                  <Text style={styles.redrillTag}>RE-DRILL</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.secLabel}>{activeCat} Chunks</Text>
            <TouchableOpacity onPress={shuffleChunks} style={styles.shuffleBtn}>
              <Text style={styles.shuffleBtnText}>🎲 Shuffle</Text>
            </TouchableOpacity>
          </View>
          {filteredChunks.map((w, idx) => (
            <View key={idx} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: w.bc }]}><Text style={[styles.badgeText, { color: w.bt }]}>{w.badge}</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={styles.cefrText}>{w.cefr}</Text>
                  <TouchableOpacity onPress={() => handleToggleFav(w.word)}><Text style={{ fontSize: 18 }}>{favorites.includes(w.word) ? '❤️' : '🤍'}</Text></TouchableOpacity>
                </View>
              </View>
              <View style={styles.wordRow}>
                <Text style={styles.wordBig}>{w.word}</Text>
                <TouchableOpacity onPress={() => speak(w.word)} style={styles.speakBtnTiny}><Text style={styles.speakIcon}>🔊</Text></TouchableOpacity>
              </View>
              <Text style={styles.wtype}>{w.type}</Text>
              <Text style={styles.def}>{w.def}</Text>
              
              <Text style={styles.secTitle}>Everyday sentences</Text>
              {w.everydaySentences.map((s, i) => (
                <View key={i} style={styles.sentenceRow}>
                  <Text style={styles.ctxTag}>{s.context}</Text>
                  <View style={styles.sentenceLine}>
                    <Text style={styles.sentenceText}>{s.sentence.replace('<strong>', '').replace('</strong>', '')}</Text>
                    <TouchableOpacity onPress={() => speak(s.sentence)}><Text style={styles.speakIconSmall}>🔊</Text></TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.cardDrillBtn} onPress={() => startDrill(w)}>
                <Text style={styles.cardDrillBtnText}>Test Active Recall</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity 
            style={[styles.fetchMoreBtn, fetchingMore && styles.fetchMoreBtnActive]} 
            onPress={handleFetchMore}
            disabled={fetchingMore}
          >
            {fetchingMore ? <ActivityIndicator size="small" color="#fff" /> : (
              <Text style={styles.fetchMoreBtnText}>✨ Generate more with AI Coach</Text>
            )}
          </TouchableOpacity>
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <View style={styles.drillOverlay}>
          <TouchableOpacity style={styles.drillCloseIcon} onPress={() => setStage(DRILL_STAGES.IDLE)}><Text style={styles.drillCloseIconText}>✕</Text></TouchableOpacity>
          {stage === DRILL_STAGES.FLASH && (
            <Animated.View style={[styles.flashBox, { opacity: flashAnim }]}>
              <Text style={styles.drillWordFlash}>{currentDrillWord?.word || "Get ready..."}</Text>
              <Text style={styles.flashHint}>Look carefully...</Text>
            </Animated.View>
          )}

          {stage === DRILL_STAGES.RECALL && (
            <View style={styles.recallBox}>
              <Text style={styles.recallLabel}>RECALL NOW</Text>
              <Text style={styles.hiddenWord}>WORD HIDDEN</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Type or Speak your sentence..."
                  placeholderTextColor="#888"
                  autoFocus={!isRecording}
                  multiline
                  value={userInput}
                  onChangeText={setUserInput}
                />
                <TouchableOpacity 
                   style={[styles.voiceBtn, isRecording && styles.voiceBtnActive]} 
                   onPress={handleVoiceRecall}
                >
                  <Text style={styles.voiceBtnIcon}>{isRecording ? '⏹' : '🎤'}</Text>
                </TouchableOpacity>
              </View>
              {transcribing && <ActivityIndicator color="#6C63FF" style={{ marginTop: 10 }} />}
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitRecall}>
                <Text style={styles.submitBtnText}>Submit for AI Check</Text>
              </TouchableOpacity>
            </View>
          )}

          {stage === DRILL_STAGES.CHECKING && (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#6C63FF" />
              <Text style={styles.checkingText}>Gemini is evaluating your naturalness...</Text>
            </View>
          )}

          {stage === DRILL_STAGES.FEEDBACK && aiResult && (
            <ScrollView contentContainerStyle={styles.feedbackScroll}>
              <Text style={[styles.feedbackTitle, { color: aiResult.correct ? '#43C6AC' : '#FF6584' }]}>{aiResult.correct ? '🎉 Perfectly Natural!' : '⚠️ Needs Tuning'}</Text>
              <View style={styles.feedbackCard}>
                <Text style={styles.feedbackLabel}>Your Sentence</Text>
                <Text style={styles.userSentence}>"{userInput}"</Text>
                <Text style={styles.feedbackLabel}>Coach Feedback</Text>
                <Text style={styles.feedbackBody}>{aiResult.feedback}</Text>
                <Text style={styles.feedbackLabel}>Natural Model</Text>
                <Text style={styles.modelSentence}>"{aiResult.modelSentence}"</Text>
                <TouchableOpacity onPress={() => speak(aiResult.modelSentence)} style={styles.speakBtnFeedback}><Text style={styles.speakIcon}>🔊 Listen to Model</Text></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.closeDrillBtn} onPress={() => setStage(DRILL_STAGES.IDLE)}><Text style={styles.closeDrillBtnText}>Continue Practice</Text></TouchableOpacity>
            </ScrollView>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  scroll: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 20 },
  catScroll: { marginBottom: 20 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1C1C36', marginRight: 10, borderWidth: 1, borderColor: '#2A2A4A' },
  catBtnActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  catText: { color: '#B0B0D0', fontWeight: '700', fontSize: 13 },
  catTextActive: { color: '#fff' },

  card: { backgroundColor: '#1C1C36', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A4A' },
  cardHighlight: { backgroundColor: '#1E1B38', borderRadius: 24, padding: 24, marginBottom: 30, borderWidth: 1, borderColor: '#6C63FF' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { color: '#6C63FF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  badgeLabel: { color: '#fff', fontSize: 11, fontWeight: '900', opacity: 0.5 },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 5 },
  wordBig: { fontSize: 36, fontWeight: '900', color: '#fff' },
  speakBtnTiny: { backgroundColor: '#2A2A4A', padding: 8, borderRadius: 10 },
  speakIcon: { fontSize: 16 },
  speakIconSmall: { fontSize: 12, opacity: 0.7 },
  wtype: { fontSize: 11, color: '#666', textTransform: 'uppercase', marginBottom: 10 },
  def: { fontSize: 15, color: '#B0B0D0', lineHeight: 22, marginBottom: 20 },
  
  secTitle: { fontSize: 11, fontWeight: '800', color: '#444', textTransform: 'uppercase', marginTop: 20, marginBottom: 10 },
  sentenceRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2A2A4A' },
  ctxTag: { fontSize: 9, color: '#6C63FF', fontWeight: '900', marginBottom: 2 },
  sentenceLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sentenceText: { color: '#fff', fontSize: 14, lineHeight: 20, flex: 1, marginRight: 10 },
  
  drillBtn: { backgroundColor: '#6C63FF', paddingVertical: 15, borderRadius: 15, marginTop: 20, alignItems: 'center' },
  drillBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  cardDrillBtn: { marginTop: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#2A2A4A', alignItems: 'center' },
  cardDrillBtnText: { color: '#6C63FF', fontWeight: '800', fontSize: 13 },

  secLabel: { fontSize: 14, fontWeight: '900', color: '#fff', textTransform: 'uppercase' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 15 },
  shuffleBtn: { paddingHorizontal: 10, paddingVertical: 5 },
  shuffleBtnText: { color: '#6C63FF', fontWeight: '800', fontSize: 12 },
  stuckCard: { backgroundColor: '#FF658422', padding: 16, borderRadius: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FF658444' },
  stuckWord: { color: '#fff', fontSize: 18, fontWeight: '800' },
  stuckAttempts: { color: '#FF6584', fontSize: 11, fontWeight: '600' },
  redrillTag: { color: '#FF6584', fontWeight: '900', fontSize: 11 },

  drillOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  drillCloseIcon: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  drillCloseIconText: { color: '#444', fontSize: 24, fontWeight: '700' },
  flashBox: { alignItems: 'center' },
  drillWordFlash: { fontSize: 38, fontWeight: '900', color: '#fff', textAlign: 'center', paddingHorizontal: 20 },
  flashHint: { color: '#6C63FF', marginTop: 20, fontSize: 16, fontWeight: '800' },
  
  recallBox: { flex: 1, justifyContent: 'center' },
  recallLabel: { color: '#6C63FF', fontSize: 12, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  hiddenWord: { color: '#222', fontSize: 48, fontWeight: '900', textAlign: 'center', marginBottom: 40 },
  inputContainer: { position: 'relative' },
  input: { backgroundColor: '#1C1C36', borderRadius: 24, padding: 24, color: '#fff', fontSize: 18, minHeight: 180, textAlignVertical: 'top', borderWidth: 1, borderColor: '#2A2A4A' },
  voiceBtn: { position: 'absolute', bottom: 15, right: 15, backgroundColor: '#6C63FF', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  voiceBtnActive: { backgroundColor: '#FF6584' },
  voiceBtnIcon: { fontSize: 20, color: '#fff' },
  submitBtn: { backgroundColor: '#6C63FF', paddingVertical: 18, borderRadius: 18, marginTop: 20, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  
  checkingText: { color: '#B0B0D0', marginTop: 20, fontWeight: '700' },
  feedbackScroll: { paddingVertical: 40 },
  feedbackTitle: { fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 30 },
  feedbackCard: { backgroundColor: '#1C1C36', borderRadius: 24, padding: 24, marginBottom: 30 },
  feedbackLabel: { fontSize: 10, fontWeight: '900', color: '#6C63FF', textTransform: 'uppercase', marginBottom: 8, marginTop: 20 },
  userSentence: { color: '#fff', fontSize: 18 },
  feedbackBody: { color: '#B0B0D0', fontSize: 15, lineHeight: 22 },
  modelSentence: { color: '#43C6AC', fontSize: 18, fontWeight: '800', lineHeight: 26 },
  speakBtnFeedback: { marginTop: 15, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10, backgroundColor: '#2A2A4A' },
  closeDrillBtn: { backgroundColor: '#6C63FF', paddingVertical: 18, borderRadius: 18, alignItems: 'center' },
  closeDrillBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  cefrText: { color: '#444', fontSize: 11, fontWeight: '900' },
  fetchMoreBtn: { 
    marginHorizontal: 16, 
    marginVertical: 20, 
    backgroundColor: '#6C63FF22', 
    paddingVertical: 18, 
    borderRadius: 20, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#6C63FF44',
    borderStyle: 'dashed'
  },
  fetchMoreBtnActive: { backgroundColor: '#6C63FF44', borderStyle: 'solid' },
  fetchMoreBtnText: { color: '#6C63FF', fontWeight: '900', fontSize: 14 },
});
