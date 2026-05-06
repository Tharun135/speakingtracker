import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Dimensions, 
  TouchableOpacity, StatusBar, SafeAreaView, ActivityIndicator,
  Animated, Platform, Alert, Easing, AppState
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { analyzeRecording, getEndlessShadowing } from '../utils/gemini';
import { addXP } from '../utils/storage';
import { speak } from '../utils/speech';

import ErrorBoundary from '../components/ErrorBoundary';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const MIN_SENTENCE_HEIGHT = 80; // Tighter spacing for marathon flow


export default function ShadowingScreen(props) {
  return (
    <ErrorBoundary>
      <ShadowingScreenInternal {...props} />
    </ErrorBoundary>
  );
}

function ShadowingScreenInternal({ navigation }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState(null);

  const [flowItems, setFlowItems] = useState([]);
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowActive, setFlowActive] = useState(false);
  const flowAnim = useRef(new Animated.Value(SCREEN_HEIGHT * 0.45)).current;
  const currentSentenceIdx = useRef(0);
  const isFlowStopping = useRef(false);
  const [activeSentence, setActiveSentence] = useState(0);

  const lastSentenceStartTime = useRef(Date.now());
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
    const rawSentences = content.match(/[^.!?]+[.!?]*/g) || [content];
    
    // Chunking logic: Max 5 words per line
    const chunkedSentences = [];
    rawSentences.forEach(s => {
      const words = s.trim().split(/\s+/);
      for (let i = 0; i < words.length; i += 5) {
        const chunk = words.slice(i, i + 5).join(' ');
        if (chunk) chunkedSentences.push(chunk);
      }
    });
    
    let totalWords = 0;
    let currentTotalHeight = 0;
    const cumulativeHeights = [];
    const processedSentences = chunkedSentences.map(s => {
      const trimmed = s.trim();
      const words = trimmed.split(/\s+/).length;
      totalWords += words;
      cumulativeHeights.push(currentTotalHeight);
      const h = Math.max(100, words * 5 + 60); // Tighter height for shorter lines
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
            resolve();
          });
        });
      }
      
      if (!isFlowStopping.current) {
        // Brief pause at the end of the script
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (!isFlowStopping.current) {
          // Auto-load next session
          setFlowLoading(true);
          try {
            const data = await getEndlessShadowing();
            setFlowItems(data);
            currentSentenceIdx.current = 0;
            setActiveSentence(0);
            flowAnim.setValue(SCREEN_HEIGHT * 0.45);
            // Give useMemo a moment to recalculate
            setTimeout(() => {
              if (!isFlowStopping.current) startFlow();
            }, 500);
          } catch (e) {
            console.error(e);
            setFlowActive(false);
          } finally {
            setFlowLoading(false);
          }
        }
      } else {
        setFlowActive(false);
      }
    };

    runSession();
  };

  const loadFlowContent = async (isAuto = false) => {
    if (!isAuto) stopFlow(); 
    setFlowLoading(true);
    try {
      const data = await getEndlessShadowing();
      setFlowItems(data);
      currentSentenceIdx.current = 0;
      setActiveSentence(0);
      flowAnim.setValue(SCREEN_HEIGHT * 0.45);
    } catch (e) {
      console.error(e);
    } finally {
      setFlowLoading(false);
    }
  };

  useEffect(() => {
    loadFlowContent();
  }, []);

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
        stopFlow();
      } else {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') return;
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(recording);
        setIsRecording(true);
        setReport(null);
        fadeAnim.setValue(0);
        setTimeout(startFlow, 500);
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
      
      <View style={styles.flowScreen}>
        {flowLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : flowItems.length > 0 ? (
          <View style={styles.flowStage}>
            <Animated.View style={[styles.flowContent, { transform: [{ translateY: flowAnim }] }]}>
              {flowData.sentences.map((line, i) => (
                <View key={i} style={[styles.flowLineWrapper, { height: line.height }]}>
                  <Text style={[
                    styles.flowText,
                    activeSentence === i && flowActive && { color: '#00FF00', fontWeight: '900' }
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
                          flowAnim.setValue(SCREEN_HEIGHT * 0.45);
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  flowScreen: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  flowStage: { width: '100%', height: '100%', alignItems: 'center' },
  flowContent: { width: '100%', alignItems: 'center' },
  flowLineWrapper: { justifyContent: 'center', alignItems: 'center', width: '100%' },
  flowText: { color: '#fff', fontSize: 28, fontWeight: '700', textAlign: 'center', width: '90%', lineHeight: 36 },
  flowOverlay: { position: 'absolute', bottom: 120, flexDirection: 'row', gap: 10, zIndex: 10 },
  flowStartBtn: { backgroundColor: '#444', paddingHorizontal: 30, paddingVertical: 18, borderRadius: 35, borderWidth: 1, borderColor: '#666' },
  flowStartText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  flowStopBtn: { backgroundColor: '#CC0000', paddingHorizontal: 35, paddingVertical: 18, borderRadius: 35 },
  flowStopText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  shuffleFlowBtn: { backgroundColor: '#222', paddingHorizontal: 25, paddingVertical: 18, borderRadius: 35, borderWidth: 1, borderColor: '#444' },
  shuffleFlowText: { color: '#bbb', fontWeight: '800', fontSize: 15 },
  loadingBox: { alignItems: 'center', gap: 15 },
  loadingText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  retryBox: { padding: 25, backgroundColor: '#222', borderRadius: 15 },
});
