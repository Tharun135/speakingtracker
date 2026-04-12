import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Animated, Dimensions, 
  TouchableOpacity, StatusBar, SafeAreaView, Easing, 
} from 'react-native';
import { SHADOWING_SCRIPTS } from '../data/shadowingData';

const { height, width } = Dimensions.get('window');
const LINE_HEIGHT = 65; // Estimated height for font + margin

export default function ShadowingScreen({ navigation }) {
  const [script, setScript] = useState(SHADOWING_SCRIPTS[0]);
  const scrollAnim = useRef(new Animated.Value(height)).current;
  const animationRef = useRef(null);

  // Convert " / " from the content into new lines
  const displayLines = script.content.split(' / ');
  const scrollDistance = -(displayLines.length * LINE_HEIGHT + height * 0.2);
  const scrollDuration = displayLines.length * 3500; // ~3.5s per line for readable pace

  useEffect(() => {
    startAnimation();
    return () => stopAnimation();
  }, [script]);

  const startAnimation = () => {
    scrollAnim.setValue(height * 0.8);
    animationRef.current = Animated.timing(scrollAnim, {
      toValue: scrollDistance, 
      duration: scrollDuration,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animationRef.current.start();
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
  };

  const shuffleScript = () => {
    stopAnimation();
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
          <Text key={index} style={styles.shadowText}>{line}</Text>
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
    justifyContent: 'center',
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
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#333',
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
