import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Dimensions, 
  TouchableOpacity, StatusBar, SafeAreaView, ActivityIndicator,
  Animated, Platform, Alert, Easing, AppState
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { SHADOWING_SCRIPTS } from '../data/shadowingData';
import { analyzeRecording, getEndlessShadowing } from '../utils/gemini';
import { addXP } from '../utils/storage';
import { speak } from '../utils/speech';

import ErrorBoundary from '../components/ErrorBoundary';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MIN_SENTENCE_HEIGHT = 80; // Tighter spacing for marathon flow

function parseScript(content) {
  if (!content) return [];
  return content.split(/(\s+|\/\/|\/|\.\.\.|—)/).filter(Boolean).map(token => ({
    word: token.trim(),
    isPause: token.trim() === '/' || token.trim() === '...' || token.trim() === '—',
    isLongPause: token.trim() === '//',
    isSpace: /^\s+$/.test(token),
  })).filter(t => !t.isSpace && t.word !== '');
}

export default function ShadowingScreen(props) {
  return (
    <ErrorBoundary>
      <ShadowingScreenInternal {...props} />
    </ErrorBoundary>
  );
}

function ShadowingScreenInternal({ navigation }) {
  const [activeTab, setActiveTab] = useState('Famous'); 
  const [activeScript, setActiveScript] = useState(SHADOWING_SCRIPTS[0]);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);
  const [isPlayingRef, setIsPlayingRef] = useState(false);

  // ── Visual Pacer (Famous Tab) ──────────────────────────────
  const famousData = useMemo(() => {
    if (!activeScript) return { sentences: [], totalWords: 0, cumulativeHeights: [], totalHeight: 0 };
    // Split by pauses (/ or //) or standard punctuation
    const chunks = activeScript.content.split(/\/\/|\/|[.!?]/).filter(s => s.trim().length > 0);
    let totalWords = 0;
    let currentTotalHeight = 0;
    const cumulativeHeights = [];
    const processed = chunks.map(s => {
      const trimmed = s.trim();
      const words = trimmed.split(/\s+/).length;
      totalWords += words;
      cumulativeHeights.push(currentTotalHeight);
      const h = Math.max(100, words * 4 + 60); 
      currentTotalHeight += h;
      return { text: trimmed, words, height: h };
    });
    return { sentences: processed, totalWords, cumulativeHeights, totalHeight: currentTotalHeight };
  }, [activeScript]);

  const [famousActive, setFamousActive] = useState(false);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const famousAnim = useRef(new Animated.Value(200)).current;

  const startPacer = useCallback(() => {
    if (famousData.sentences.length === 0) return;
    setFamousActive(true);
    isFlowStopping.current = false;
    
    const { sentences, cumulativeHeights } = famousData;
    const startPos = 200; // Centered start in the pacer box

    const runFamous = async () => {
      for (let i = 0; i < sentences.length; i++) {
        if (isFlowStopping.current) break;

        const s = sentences[i];
        const duration = s.words * 550; 
        const targetScroll = startPos - cumulativeHeights[i] - (s.height / 2);

        setActiveWordIdx(i); // Reuse this for sentence highlighting
        
        await new Promise(resolve => {
          Animated.timing(famousAnim, {
            toValue: targetScroll,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: false,
          }).start(() => resolve());
        });
      }
      if (!isFlowStopping.current) setFamousActive(false);
    };

    runFamous();
  }, [famousData]);

  const stopPacer = useCallback(() => {
    isFlowStopping.current = true;
    setFamousActive(false);
    famousAnim.stopAnimation();
    setActiveWordIdx(-1);
  }, []);

  // ── Daily Flow (Bottom-to-Top) ─────────────────────────────
  const [flowItems, setFlowItems] = useState([]);
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowActive, setFlowActive] = useState(false);
  const flowAnim = useRef(new Animated.Value(SCREEN_HEIGHT * 0.45)).current;
  const currentSentenceIdx = useRef(0);
  const isFlowStopping = useRef(false);
  const [activeSentence, setActiveSentence] = useState(0);

  const lastSentenceStartTime = useRef(Date.now());
  const msPerWordRef = useRef(450); // Balanced pace
  const flowTimer = useRef(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState.match(/inactive|background/)) {
        stopFlow();
      }
    });

    return () => {
      subscription.remove();
      if (flowTimer.current) clearTimeout(flowTimer.current);
    };
  }, []);

  const stopFlow = () => {
    isFlowStopping.current = true;
    setFlowActive(false);
    Speech.stop();
    flowAnim.stopAnimation();
    if (flowTimer.current) clearTimeout(flowTimer.current);
  };

  const flowData = useMemo(() => {
    if (flowItems.length === 0) return { sentences: [], totalWords: 0, cumulativeHeights: [], totalHeight: 0 };
    const content = flowItems[0].text;
    // Improved sentence splitting
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
    let totalWords = 0;
    let currentTotalHeight = 0;
    const cumulativeHeights = [];
    const processedSentences = sentences.map(s => {
      const trimmed = s.trim();
      const words = trimmed.split(/\s+/).length;
      totalWords += words;
      cumulativeHeights.push(currentTotalHeight);
      // Minimal height for tight flow, scales only slightly for extreme length
      const h = Math.max(110, words * 3 + 60); 
      currentTotalHeight += h;
      return { text: trimmed, words, height: h };
    });
    return { 
      sentences: processedSentences, 
      totalWords, 
      cumulativeHeights, 
      totalHeight: currentTotalHeight 
    };
  }, [flowItems]);

  const startFlow = async () => {
    if (flowData.sentences.length === 0) return;
    setFlowActive(true);
    isFlowStopping.current = false;
    
    const { sentences, cumulativeHeights } = flowData;
    const startPos = SCREEN_HEIGHT * 0.35;

    const runSession = async () => {
      for (let i = currentSentenceIdx.current; i < sentences.length; i++) {
        if (isFlowStopping.current) break;

        const s = sentences[i];
        // Calculate duration based on words (450ms per word at 1.0 rate, 
        // but speak is 0.8 so we give it slightly more time)
        const duration = s.words * 550; 
        const targetScroll = startPos - cumulativeHeights[i] - (s.height / 2);

        setActiveSentence(i);
        currentSentenceIdx.current = i;
        
        Speech.stop();
        speak(s.text, { rate: 0.8 });

        await new Promise(resolve => {
          Animated.timing(flowAnim, {
            toValue: targetScroll,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: false,
          }).start((res) => {
            // Even if interrupted, we resolve to check isFlowStopping
            resolve();
          });
        });
      }
      if (!isFlowStopping.current) {
        setFlowActive(false);
        // Final scroll to end
        Animated.timing(flowAnim, {
          toValue: startPos - flowData.totalHeight,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      }
    };

    runSession();
  };

  const loadFlowContent = async () => {
    stopFlow(); 
    setFlowLoading(true);
    try {
      const data = await getEndlessShadowing();
      setFlowItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setFlowLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Daily' && flowItems.length === 0) {
      loadFlowContent();
    }
  }, [activeTab]);

  // ── Reporting & Recording ──────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (report) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: Platform.OS !== 'web',
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
        if (activeTab === 'Daily') stopFlow();
      } else {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') return;
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(recording);
        setIsRecording(true);
        setReport(null);
        fadeAnim.setValue(0);
        if (activeTab === 'Famous') setTimeout(startPacer, 500);
        else setTimeout(startFlow, 500);
      }
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  const processAnalysis = async (uri) => {
    setAnalyzing(true);
    try {
      const result = await analyzeRecording(uri, { wpm: 140, vibe: "Inspirational" });
      setReport(result);
      await addXP(200); 
    } catch (e) {
      Alert.alert("Coach is Offline", "Analysis completed. Check your profile for XP rewards.");
    } finally {
      setAnalyzing(false);
    }
  };

  const playReference = () => {
    if (isPlayingRef) {
      Speech.stop();
      setIsPlayingRef(false);
      stopPacer();
      return;
    }
    setIsPlayingRef(true);
    startPacer();
    const cleanText = activeScript?.content.replace(/\/\/|\/|\.\.\.|—/g, '');
    speak(cleanText, {
      rate: 0.85,
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
      
      {/* V4.2 Banner - Confirmed Fix */}
      <View style={styles.versionBanner}>
        <Text style={styles.versionText}>V4.2 - SMART SYNC ENABLED</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Famous' && styles.activeTab]}
          onPress={() => { setActiveTab('Famous'); stopFlow(); setReport(null); }}
        >
          <Text style={[styles.tabText, activeTab === 'Famous' && styles.activeTabText]}>Famous Speeches</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Daily' && styles.activeTab]}
          onPress={() => { setActiveTab('Daily'); stopPacer(); setReport(null); }}
        >
          <Text style={[styles.tabText, activeTab === 'Daily' && styles.activeTabText]}>Daily Flow</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {activeTab === 'Famous' ? (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Shadow Hub</Text>
              <Text style={styles.subtitle}>Practice World Famous Speeches</Text>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.styleList}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              {SHADOWING_SCRIPTS.map((script) => (
                <TouchableOpacity 
                  key={script.id} 
                  onPress={() => { setActiveScript(script); setReport(null); stopPacer(); }}
                  style={[styles.styleCard, activeScript.id === script.id && styles.activeStyleCard, { marginRight: 12 }]}
                >
                  <Text style={styles.styleEmoji}>📜</Text>
                  <Text style={[styles.styleName, activeScript.id === script.id && styles.activeStyleName]} numberOfLines={1}>{script.title}</Text>
                  <Text style={styles.authorName}>{script.author}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.scriptArea}>
               <View style={styles.scriptHeader}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.scriptBadge}>{activeScript.title.toUpperCase()}</Text>
                    <Text style={styles.authorLabel}>by {activeScript.author}</Text>
                  </View>
                  <TouchableOpacity onPress={playReference} style={[styles.listenBtn, isPlayingRef && styles.listenBtnActive]}>
                     <Text style={styles.listenText}>{isPlayingRef ? '⏹ Stop' : '🔊 Listen'}</Text>
                  </TouchableOpacity>
               </View>
               
               <View style={styles.famousFlowScreen}>
                  <Animated.View style={[styles.flowContent, { transform: [{ translateY: famousAnim }] }]}>
                    {famousData.sentences.map((line, i) => (
                      <View key={i} style={[styles.flowLineWrapper, { height: line.height }]}>
                        <Text style={[
                          styles.flowText,
                          activeWordIdx === i && (famousActive || isPlayingRef) && { color: '#FFD700', transform: [{ scale: 1.05 }] }
                        ]}>{line.text}</Text>
                      </View>
                    ))}
                    <View style={{height: 400}} />
                  </Animated.View>
               </View>
            </View>
          </>
        ) : (
          <View style={styles.flowContainer}>
            <Text style={styles.title}>Daily Flow</Text>
            <Text style={styles.subtitle}>Ultimate 15-Minute Marathon</Text>
            
            <View style={styles.flowScreen}>
              {flowLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color="#6C63FF" size="large" />
                  <Text style={styles.loadingText}>Fetching massive content...</Text>
                </View>
              ) : flowItems.length > 0 ? (
                <View style={styles.flowStage}>
                  <Animated.View style={[styles.flowContent, { transform: [{ translateY: flowAnim }] }]}>
                    <Text style={styles.flowIntro}>SHADOWING MARATHON</Text>
                    <Text style={styles.flowTopicTag}>{flowItems[0].topic.toUpperCase()}</Text>
                    {flowData.sentences.map((line, i) => (
                      <View key={i} style={[styles.flowLineWrapper, { height: line.height }]}>
                        <Text style={[
                          styles.flowText,
                          activeSentence === i && flowActive && { color: '#FFD700', transform: [{ scale: 1.05 }] }
                        ]}>{line.text}</Text>
                      </View>
                    ))}
                    <View style={{height: 600}} />
                  </Animated.View>
                  
                  <View style={styles.flowOverlay}>
                    {!flowActive ? (
                      <>
                        <TouchableOpacity 
                          style={styles.flowStartBtn} 
                          onPress={startFlow}
                        >
                          <Text style={styles.flowStartText}>
                            {currentSentenceIdx.current > 0 ? '▶ Resume Session' : '▶ Start Marathon'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.shuffleFlowBtn} 
                          onPress={() => {
                            currentSentenceIdx.current = 0;
                            setActiveSentence(0);
                            flowAnim.setValue(SCREEN_HEIGHT * 0.35);
                            loadFlowContent();
                          }}
                        >
                          <Text style={styles.shuffleFlowText}>🔄 New Session</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity style={styles.flowStopBtn} onPress={stopFlow}>
                        <Text style={styles.flowStopText}>⏹ Stop Session</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <TouchableOpacity onPress={loadFlowContent} style={styles.retryBox}>
                   <Text style={{ color: '#fff' }}>Tap to Load Marathon Content</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.flowHint}>Sentence-by-sentence sync enabled.</Text>
          </View>
        )}

        <TouchableOpacity 
          onPress={toggleRecording} 
          style={[styles.mainBtn, isRecording && styles.mainBtnActive]}
          disabled={analyzing}
        >
           {analyzing ? (
             <ActivityIndicator color="#fff" />
           ) : (
             <Text style={styles.mainBtnText}>{isRecording ? '⏹ FINISH MARATHON' : '🎙️ START MARATHON'}</Text>
           )}
        </TouchableOpacity>

        {report && (
          <Animated.View style={[styles.reportContainer, { opacity: fadeAnim }]}>
            <Text style={styles.reportHeader}>Session Results</Text>
            <View style={styles.metricsRow}>
              {renderMetric('Tempo', report.metrics?.wpm || '---', '⚡')}
              {renderMetric('Pitch', `${report.metrics?.pitchVariation || 0}/10`, '〽️')}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 20 },
  versionBanner: { backgroundColor: '#FFD70022', paddingVertical: 4, alignItems: 'center', marginBottom: 10 },
  versionText: { color: '#FFD700', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 10, gap: 10, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 15, backgroundColor: '#1A1A2E', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A4A' },
  activeTab: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  tabText: { color: '#B0B0D0', fontWeight: '800', fontSize: 13 },
  activeTabText: { color: '#fff' },
  header: { marginBottom: 25 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  subtitle: { fontSize: 14, color: '#6C63FF', fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },
  styleList: { marginBottom: 20 },
  styleCard: { backgroundColor: '#1A1A2E', padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A4A', width: 160 },
  activeStyleCard: { backgroundColor: '#6C63FF22', borderColor: '#6C63FF' },
  styleEmoji: { fontSize: 24, marginBottom: 8 },
  styleName: { color: '#B0B0D0', fontWeight: '800', fontSize: 13, textAlign: 'center' },
  activeStyleName: { color: '#fff' },
  authorName: { color: '#666', fontSize: 10, marginTop: 4 },
  scriptArea: { backgroundColor: '#1C1C36', borderRadius: 24, padding: 25, marginBottom: 25, borderWidth: 1, borderColor: '#6C63FF33' },
  scriptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  scriptBadge: { color: '#43C6AC', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  authorLabel: { color: '#666', fontSize: 10, marginTop: 2 },
  listenBtn: { backgroundColor: '#1A1A2E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, borderColor: '#6C63FF' },
  listenBtnActive: { backgroundColor: '#FF658422', borderColor: '#FF6584' },
  listenText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  pacerWords: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  pacerWord: { fontSize: 18, fontWeight: '700', color: '#444466' },
  pacerWordActive: { color: '#FFD700', scale: 1.2 },
  pacerWordDone: { color: '#6C63FF88' },
  flowContainer: { marginBottom: 25 },
  flowScreen: { height: 550, backgroundColor: '#1C1C36', borderRadius: 24, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#6C63FF33' },
  flowStage: { width: '100%', height: '100%', alignItems: 'center' },
  flowContent: { width: '100%', alignItems: 'center', paddingHorizontal: 20 },
  flowIntro: { color: '#4CAF50', fontSize: 24, fontWeight: '900', marginBottom: 20 },
  flowTopicTag: { color: '#6C63FF', fontSize: 11, fontWeight: '900', marginBottom: 60, backgroundColor: '#6C63FF22', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  flowLineWrapper: { justifyContent: 'center', alignItems: 'center', width: '100%' },
  flowText: { color: '#B0B0D0', fontSize: 24, fontWeight: '900', textAlign: 'center', width: '92%', lineHeight: 32, letterSpacing: -0.5 },
  famousFlowScreen: { height: 400, backgroundColor: '#0A0A1A', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#6C63FF33', marginTop: 10 },
  flowOverlay: { position: 'absolute', bottom: 25, flexDirection: 'row', gap: 10 },
  flowStartBtn: { backgroundColor: '#6C63FF', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12 },
  flowStartText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  flowStopBtn: { backgroundColor: '#FF6584', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 12, shadowColor: '#FF6584', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  flowStopText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  shuffleFlowBtn: { backgroundColor: '#1A1A2E', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2A2A4A' },
  shuffleFlowText: { color: '#B0B0D0', fontWeight: '800', fontSize: 14 },
  flowHint: { color: '#444466', fontSize: 11, textAlign: 'center', marginTop: 10 },
  loadingBox: { alignItems: 'center', gap: 15 },
  loadingText: { color: '#6C63FF', fontWeight: '700', fontSize: 14 },
  retryBox: { padding: 20 },
  mainBtn: { backgroundColor: '#6C63FF', paddingVertical: 20, borderRadius: 25, alignItems: 'center', marginBottom: 30 },
  mainBtnActive: { backgroundColor: '#FF6584' },
  mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  reportContainer: { marginTop: 10 },
  reportHeader: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 20 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginBottom: 20 },
  metricCard: { flex: 1, backgroundColor: '#1A1A2E', borderRadius: 20, padding: 15, alignItems: 'center' },
  metricIcon: { fontSize: 20, marginBottom: 8 },
  metricVal: { color: '#fff', fontSize: 14, fontWeight: '900' },
  metricLabel: { color: '#444466', fontSize: 9, fontWeight: '900' }
});
