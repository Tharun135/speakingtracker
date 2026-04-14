import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Animated, Dimensions, 
  TouchableOpacity, StatusBar, SafeAreaView, Easing, 
} from 'react-native';
import * as Speech from 'expo-speech';
import { SHADOWING_SCRIPTS } from '../data/shadowingData';

const { height, width } = Dimensions.get('window');
const LINE_HEIGHT = 65; // Estimated height for font + margin

export default function ShadowingScreen({ navigation }) {
  const [script, setScript] = useState(SHADOWING_SCRIPTS[0]);
  const scrollAnim = useRef(new Animated.Value(height * 0.3)).current;
  const currentScrollValue = useRef(height * 0.3);
  const animationRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const id = scrollAnim.addListener(({ value }) => {
      currentScrollValue.current = value;
    });
    return () => scrollAnim.removeListener(id);
  }, []);

  // Convert " / " from the content into new lines
  const displayLines = ["SPEAK LOUD AND CLEAR", ...script.content.split(' / ')];
  const scrollDistance = -(displayLines.length * LINE_HEIGHT + height * 0.2);
  const scrollDuration = displayLines.length * 4000; // ~4s per line for slightly slower, clearer pace

  useEffect(() => {
    if (isPlaying) {
      startAnimation();
    } else {
      stopAnimation();
    }
    return () => stopAnimation();
  }, [isPlaying, script]);

  const startAnimation = () => {
    // Reset if we're at the very end or if it's a fresh start
    if (currentScrollValue.current <= scrollDistance + 20) {
      scrollAnim.setValue(height * 0.3);
      currentScrollValue.current = height * 0.3;
    }

    const totalDist = height * 0.3 - scrollDistance;
    const remainingDist = currentScrollValue.current - scrollDistance;
    const remainingDuration = scrollDuration * (remainingDist / totalDist);

    animationRef.current = Animated.timing(scrollAnim, {
      toValue: scrollDistance, 
      duration: Math.max(0, remainingDuration),
      easing: Easing.linear,
      useNativeDriver: true,
    });
    
    animationRef.current.start(({ finished }) => {
      if (finished) {
        setIsPlaying(false);
      }
    });

    // Start Text-to-Speech
    const speechText = script.content.replace(/\//g, '.'); // Replace slashes with periods for better pacing
    Speech.speak(speechText, {
      rate: 0.95,  // Slightly measured for better resonance
      pitch: 0.90, // Lower pitch to add 'bass' and depth
      onDone: () => {
        // Optional: extra logic when speech finishes
      }
    });
  };

  const stopAnimation = () => {
    Speech.stop();
    if (animationRef.current) {
      animationRef.current.stop();
    }
  };

  const shuffleScript = () => {
    setIsPlaying(false);
    stopAnimation();
    scrollAnim.setValue(height * 0.3);
    currentScrollValue.current = height * 0.3;
    const randomIndex = Math.floor(Math.random() * SHADOWING_SCRIPTS.length);
    setScript(SHADOWING_SCRIPTS[randomIndex]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Animated.View 
        style={[
          styles.textContainer, 
          { transform: [{ translateY: scrollAnim }] }
        ]}
      >
        {displayLines.map((line, index) => (
          <Text 
            key={index} 
            style={[
              styles.shadowText,
              index === 0 && styles.instructionText
            ]}
          >
            {line}
          </Text>
        ))}
      </Animated.View>

      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.navigate('Today')}
          >
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.difficultyBadge}>
             <Text style={styles.difficultyText}>{script.difficulty}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {!isPlaying ? (
            <TouchableOpacity 
              style={[styles.playBtn, { backgroundColor: '#4CAF50' }]} 
              onPress={() => setIsPlaying(true)}
            >
              <Text style={styles.shuffleIcon}>▶️</Text>
              <Text style={styles.shuffleText}>Start Shadowing</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.playBtn, { backgroundColor: '#F44336' }]} 
              onPress={() => setIsPlaying(false)}
            >
              <Text style={styles.shuffleIcon}>⏸️</Text>
              <Text style={styles.shuffleText}>Pause</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.shuffleBtn} onPress={shuffleScript}>
            <Text style={styles.shuffleIcon}>🔄</Text>
            <Text style={styles.shuffleText}>Shuffle</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  textContainer: {
    width: '100%',
    maxWidth: 600, // Limit width for better eye tracking
    paddingHorizontal: 50,
    alignItems: 'center',
  },
  shadowText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1,
  },
  instructionText: {
    color: '#4CAF50',
    fontSize: 40,
    marginBottom: 60,
    textTransform: 'uppercase',
    letterSpacing: 4,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  backIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  difficultyBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  footer: {
    paddingBottom: 110, // Avoid tab bar
    alignItems: 'center',
  },
  shuffleBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 15,
  },
  playBtn: {
    flexDirection: 'row',
    paddingHorizontal: 35,
    paddingVertical: 18,
    borderRadius: 35,
    alignItems: 'center',
    gap: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  shuffleIcon: {
    fontSize: 20,
  },
  shuffleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
