import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { getExerciseContent, analyzeRecording, startConversationSim, continueConversationSim } from '../utils/gemini';
import { addXP, saveToJournal } from '../utils/storage';
import { speak, stopSpeech } from '../utils/speech';

const { width } = Dimensions.get('window');

export default function VoiceLabScreen({ profile }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeEx, setActiveEx] = useState(null);
  const [currentType, setCurrentType] = useState('shadowing');
  
  // Recording State
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Chat / Simulation State
  const [simActive, setSimActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [simScenario, setSimScenario] = useState('Job Interview');
  const [simRecording, setSimRecording] = useState(null);
  const [isSimRecording, setIsSimRecording] = useState(false);



  useEffect(() => {
    return () => {
      stopSpeech();
      if (recording) recording.stopAndUnloadAsync();
    };
  }, []);

  const handlePlaySentence = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }
    const text = activeEx?.text || (activeEx?.pair ? activeEx.pair.join(' versus ') : '');
    if (!text) return;
    setIsSpeaking(true);
    speak(text);
    setTimeout(() => setIsSpeaking(false), text.length * 60 + 1000);
  };

  const loadExercises = async (type) => {
    setLoading(true);
    setSimActive(false);
    setScoreResult(null);
    setCurrentType(type);
    
    // Only clear for a total category change, don't clear for same-category shuffle
    if (currentType !== type) setExercises([]);
    
    try {
      const content = await getExerciseContent(type);
      if (content && Array.isArray(content) && content.length > 0) {
        setExercises(content);
      } else {
        Alert.alert(
          "Service Unavailable", 
          "The AI Coach is currently busy. Please try clicking the category again in a few seconds.",
          [{ text: "OK" }]
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Connection Error", "Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = async () => {
    try {
      if (isRecording) {
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setAnalyzing(true);
        const result = await analyzeRecording(uri);
        setScoreResult(result);
        await saveToJournal(result, uri);
        await addXP(20);
        setAnalyzing(false);
      } else {
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status === 'granted') {
          await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
          const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
          setRecording(recording);
          setIsRecording(true);
        }
      }
    } catch (e) { 
      console.error(e); 
      setAnalyzing(false); 
      setIsRecording(false);
    }
  };

  const startSim = async (scenario) => {
    setLoading(true);
    setSimActive(true);
    setExercises([]);
    setScoreResult(null);
    setCurrentType('roleplay');
    setSimScenario(scenario);
    setMessages([]);
    setCurrentInput('');
    try {
      const opening = await startConversationSim(scenario);
      setMessages([{ role: 'model', text: opening }]);
    } catch (e) {
      setMessages([{ role: 'model', text: `Let's practice: ${scenario}! I'll start — tell me about yourself.` }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const userMsg = currentInput.trim();
    if (!userMsg) return;
    setCurrentInput('');
    const updatedMessages = [...messages, { role: 'user', text: userMsg }];
    setMessages(updatedMessages);
    setIsTyping(true);
    try {
      const reply = await continueConversationSim(simScenario, updatedMessages);
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "That's a great point! Tell me more." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startSimRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') { Alert.alert('Microphone permission required.'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setSimRecording(recording);
      setIsSimRecording(true);
    } catch (e) { console.error(e); }
  };

  const stopSimRecording = async () => {
    if (!simRecording) return;
    setIsSimRecording(false);
    try {
      await simRecording.stopAndUnloadAsync();
      const uri = simRecording.getURI();
      setSimRecording(null);
      setIsTyping(true);
      const result = await analyzeRecording(uri);
      if (result?.transcript) {
        setCurrentInput(result.transcript);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const completeExercise = async () => {
    await addXP(50);
    Alert.alert("🎉 Well done!", "You've earned 50 XP!");
    setActiveEx(null);
    setScoreResult(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {(activeEx || simActive) && (
        <TouchableOpacity 
          style={styles.floatingClose} 
          onPress={() => {
            setActiveEx(null);
            setSimActive(false);
            setScoreResult(null);
          }}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      )}
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.header}>AI Voice Lab</Text>
          
          <View style={styles.row}>
            <LabCard emoji="🗣️" title="Shadowing" onPress={() => loadExercises('shadowing')} />
            <LabCard emoji="👅" title="Twisters" onPress={() => loadExercises('tongue_twisters')} />
          </View>
          <View style={styles.row}>
            <LabCard emoji="🎭" title="Roleplay" onPress={() => startSim('Job Interview')} />
            <LabCard emoji="🔊" title="Minimal" onPress={() => loadExercises('minimal_pairs')} />
          </View>
          <View style={styles.row}>
            <LabCard emoji="💡" title="Concepts" onPress={() => loadExercises('concepts')} />
            <LabCard emoji="🧠" title="Fundamentals" onPress={() => loadExercises('fundamentals')} />
          </View>

          {loading && <ActivityIndicator color="#6C63FF" style={{ marginTop: 30 }} />}

          {/* List of Loaded Exercises */}
          {!simActive && exercises.length > 0 && !activeEx && (
            <View style={styles.exList}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.subHeader}>
                  {loading ? 'Refreshing...' : `${currentType.charAt(0).toUpperCase() + currentType.slice(1).replace('_', ' ')} Exercises`}
                </Text>
                <TouchableOpacity 
                   onPress={() => loadExercises(currentType)}
                   style={[styles.refreshBtn, loading && { opacity: 0.5 }]}
                   disabled={loading}
                >
                   <Text style={styles.refreshText}>{loading ? '⏱️' : '🔄'} Shuffle</Text>
                </TouchableOpacity>
              </View>
              {exercises.map((ex, i) => (
                <TouchableOpacity key={i} style={styles.exCard} onPress={() => setActiveEx(ex)}>
                  <Text style={styles.exText}>
                    {ex.title ? ex.title : ex.text || (ex.pair ? `${ex.pair[0]} vs ${ex.pair[1]}` : 'Practice Exercise')}
                  </Text>
                  {(ex.focusSound || ex.instruction || (ex.title && ex.text)) && (
                    <Text style={styles.exSubText} numberOfLines={2}>
                      {ex.title ? ex.text : (ex.focusSound ? `Focus: ${ex.focusSound}` : ex.instruction)}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Active Exercise View */}
          {activeEx && !simActive && (
            <View style={styles.activeArea}>
              <View style={styles.activeCard}>
                <View style={[styles.activeHeader, { justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' }]}>
                  <TouchableOpacity 
                    onPress={() => { setActiveEx(null); setScoreResult(null); }}
                    style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10 }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 16 }}>⬅️ Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.activeBadge}>
                    {currentType === 'roleplay' ? '🎭 ROLEPLAY MODE' : currentType === 'concepts' ? '💡 CONCEPT CLARIFICATION' : currentType === 'fundamentals' ? '🧠 LIFE FUNDAMENTALS' : '🗣️ PRACTISE MODE'}
                  </Text>
                </View>
                {activeEx.title && <Text style={[styles.activeText, { fontSize: 24, marginBottom: 10, marginTop: 15 }]}>{activeEx.title}</Text>}
                <Text style={[styles.activeText, activeEx.title && { fontSize: 20, fontWeight: '500' }]}>{activeEx.text || activeEx.pair?.join(' / ')}</Text>
                <Text style={styles.instruction}>{activeEx.instruction || 'Listen carefully, then say it along.'}</Text>

                {/* Big Play / Replay Button */}
                <TouchableOpacity
                  style={[styles.playAlongBtn, isSpeaking && styles.playAlongBtnActive]}
                  onPress={handlePlaySentence}
                >
                  <Text style={styles.playAlongIcon}>{isSpeaking ? '🔊' : '▶️'}</Text>
                  <Text style={styles.playAlongText}>{isSpeaking ? 'Playing... Say Along!' : 'Play & Shadow'}</Text>
                </TouchableOpacity>
                
                {scoreResult && (
                  <View style={styles.scoreCard}>
                     <View style={styles.scoreRow}>
                        <View style={styles.scoreBox}>
                           <Text style={styles.scoreVal}>{scoreResult.pronunciation?.score || 0}%</Text>
                           <Text style={styles.scoreLabel}>PRONUNCIATION</Text>
                        </View>
                        <View style={styles.scoreBox}>
                           <Text style={styles.scoreVal}>{scoreResult.fluencyScore}/10</Text>
                           <Text style={styles.scoreLabel}>FLUENCY</Text>
                        </View>
                     </View>
                     {scoreResult.pronunciation?.trickySounds?.length > 0 && (
                       <View style={styles.trickySounds}>
                          <Text style={styles.trickyLabel}>WATCH OUT FOR:</Text>
                          <View style={styles.soundPills}>
                            {scoreResult.pronunciation.trickySounds.map((s, i) => (
                              <View key={i} style={styles.soundPill}><Text style={styles.soundPillText}>{s}</Text></View>
                            ))}
                          </View>
                       </View>
                     )}
                  </View>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={[styles.recBtn, isRecording && styles.recBtnActive]} 
                    onPress={toggleRecording}
                  >
                    <Text style={styles.recBtnText}>{isRecording ? '⏹ STOP' : '🎙️ RECORD'}</Text>
                  </TouchableOpacity>
                  
                  {scoreResult && (
                    <TouchableOpacity style={styles.doneBtn} onPress={completeExercise}>
                      <Text style={styles.doneBtnText}>DONE</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {analyzing && <ActivityIndicator color="#6C63FF" style={{ marginTop: 15 }} />}
              </View>
            </View>
          )}

          {/* Chat Simulation View */}
          {simActive && (
            <View style={styles.simulationArea}>
              <ScrollView 
                style={styles.chatScroll} 
                contentContainerStyle={styles.chatContent}
                ref={(r) => r?.scrollToEnd({ animated: true })}
              >
                {messages.map((m, i) => (
                  <View key={i} style={[styles.msgBubble, m.role === 'user' ? styles.userBubble : styles.modelBubble]}>
                    <Text style={[styles.msgText, m.role === 'user' ? styles.userMsgText : styles.modelMsgText]}>{m.text}</Text>
                  </View>
                ))}
                {isTyping && <ActivityIndicator color="#6C63FF" style={{ alignSelf: 'flex-start', margin: 10 }} />}
              </ScrollView>
              
              <View style={styles.inputArea}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type or speak your response..."
                  placeholderTextColor="#666"
                  value={currentInput}
                  onChangeText={setCurrentInput}
                  onSubmitEditing={sendMessage}
                />
                <TouchableOpacity
                  onPress={isSimRecording ? stopSimRecording : startSimRecording}
                  style={[styles.micBtn, isSimRecording && styles.micBtnActive]}
                >
                  <Text style={{ fontSize: 18 }}>{isSimRecording ? '⏹️' : '🎙️'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
                   <Text style={{ fontSize: 18 }}>🚀</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.endSimBtn} onPress={() => setSimActive(false)}>
                 <Text style={styles.endSimBtnText}>End Session</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const LabCard = ({ emoji, title, onPress }) => (
  <TouchableOpacity style={styles.labCard} onPress={onPress}>
    <Text style={styles.labEmoji}>{emoji}</Text>
    <Text style={styles.labTitle}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  scroll: { padding: 20 },
  header: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 25 },
  subHeader: { fontSize: 11, fontWeight: '900', color: '#6C63FF', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  labCard: { backgroundColor: '#1A1A2E', width: '47%', height: 110, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A4A' },
  labEmoji: { fontSize: 32, marginBottom: 8 },
  labTitle: { color: '#B0B0D0', fontWeight: '800', fontSize: 13 },
  exList: { marginTop: 10 },
  exCard: { backgroundColor: '#1C1C36', padding: 20, borderRadius: 20, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#6C63FF', borderWidth: 1, borderColor: '#2A2A4A' },
  exText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  exSubText: { color: '#B0B0D0', fontSize: 11, marginTop: 4, fontWeight: '600' },
  
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  refreshBtn: { backgroundColor: '#1C1C36', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#6C63FFaa' },
  refreshText: { color: '#6C63FF', fontSize: 11, fontWeight: '900' },
  
  floatingClose: { 
    position: 'absolute', top: 50, right: 20, zIndex: 100, 
    backgroundColor: '#1A1A2E', width: 40, height: 40, borderRadius: 20, 
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A4A' 
  },
  closeIcon: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  activeArea: { marginTop: 10 },
  activeBadge: { color: '#6C63FF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  activeCard: { backgroundColor: '#1A1A2E', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#2A2A4A' },
  activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  speakIcon: { fontSize: 24 },
  activeText: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 42, marginBottom: 18 },
  instruction: { color: '#6666AA', fontSize: 14, textAlign: 'center', fontStyle: 'italic', marginBottom: 24 },
  playAlongBtn: {
    backgroundColor: '#6C63FF', borderRadius: 20, paddingVertical: 18, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  playAlongBtnActive: { backgroundColor: '#43C6AC' },
  playAlongIcon: { fontSize: 26 },
  playAlongText: { color: '#fff', fontWeight: '900', fontSize: 17 },
  
  scoreCard: { backgroundColor: '#0F0F1A', borderRadius: 20, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#2A2A4A' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  scoreBox: { alignItems: 'center' },
  scoreVal: { color: '#fff', fontSize: 24, fontWeight: '900' },
  scoreLabel: { color: '#444466', fontSize: 8, fontWeight: '900', marginTop: 4 },
  trickyLabel: { color: '#6C63FF', fontSize: 9, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  soundPills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  soundPill: { backgroundColor: '#FF658422', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  soundPillText: { color: '#FF6584', fontSize: 12, fontWeight: '800' },

  actionRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  recBtn: { backgroundColor: '#6C63FF', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 18, minWidth: 140, alignItems: 'center' },
  recBtnActive: { backgroundColor: '#FF6584' },
  recBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  doneBtn: { backgroundColor: '#2A2A4A', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 18 },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  simulationArea: { flex: 1, marginTop: 10, height: 500 },
  chatScroll: { backgroundColor: '#0F0F1A', borderRadius: 20, maxHeight: 400, marginBottom: 15 },
  chatContent: { padding: 15, gap: 12 },
  msgBubble: { padding: 16, borderRadius: 20, maxWidth: '85%' },
  userBubble: { backgroundColor: '#6C63FF', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  modelBubble: { backgroundColor: '#1A1A2E', alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#2A2A4A' },
  msgText: { fontSize: 14, lineHeight: 22, color: '#fff' },

  inputArea: { flexDirection: 'row', gap: 10, marginBottom: 15, alignItems: 'center' },
  textInput: { flex: 1, backgroundColor: '#1A1A2E', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 12, color: '#fff', borderWidth: 1, borderColor: '#2A2A4A' },
  micBtn: { backgroundColor: '#1A1A2E', width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#6C63FF' },
  micBtnActive: { backgroundColor: '#FF658422', borderColor: '#FF6584' },
  sendBtn: { backgroundColor: '#6C63FF', width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },

  endSimBtn: { backgroundColor: '#1A1A2E', paddingVertical: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A4A' },
  endSimBtnText: { color: '#FF6584', fontWeight: '800', fontSize: 13 }
});
