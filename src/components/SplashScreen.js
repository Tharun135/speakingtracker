import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform, Text } from 'react-native';

const letters = ['E', 'c', 'h', 'o', 'L', 'a', 'b'];

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Creates an opacity and transform value for each individual letter
  const letterOpacity = useRef(letters.map(() => new Animated.Value(0))).current;
  const letterTranslate = useRef(letters.map(() => new Animated.Value(-30))).current;
  
  // Animated values for the sweeping neon underline and subtitle
  const lineScale = useRef(new Animated.Value(0)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Build an array of parallel animations for each letter (fading in while dropping down)
    const letterAnimations = letters.map((_, i) => {
      return Animated.parallel([
        Animated.timing(letterOpacity[i], {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(letterTranslate[i], {
          toValue: 0,
          duration: 400,
          useNativeDriver: true, // Utilizing native driver for 60fps performance
        })
      ]);
    });

    Animated.sequence([
      Animated.delay(400),
      
      // Stagger visually cascades the animation (120ms between each letter drop)
      Animated.stagger(120, letterAnimations),
      
      // Once text is fully rendered, shoot the neon underline from the center outward
      Animated.spring(lineScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      
      // Smoothly fade in the subtitle
      Animated.timing(subOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      
      Animated.delay(1200), // Hold on screen to let the user admire the bootup
      
      // Dissolve the entire screen to reveal the app
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (onFinish) onFinish();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.logoContainer}>
        
        {/* Render each letter sequentially */}
        <View style={styles.textRow}>
          {letters.map((char, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.letter,
                // Make 'Echo' purple and 'Lab' teal for a striking two-tone design
                index < 4 ? styles.colorPurple : styles.colorTeal,
                {
                  opacity: letterOpacity[index],
                  transform: [{ translateY: letterTranslate[index] }]
                }
              ]}
            >
              {char}
            </Animated.Text>
          ))}
        </View>
        
        {/* The Neon Underline that snaps into place */}
        <Animated.View 
          style={[
            styles.underline,
            { transform: [{ scaleX: lineScale }] }
          ]} 
        />
        
        {/* Subtle high-tech boot text */}
        <Animated.Text style={[styles.subText, { opacity: subOpacity }]}>
          INITIALIZING AUDIO LAB
        </Animated.Text>
        
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A14', // An ultra-dark, rich background
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  textRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  letter: {
    fontSize: 64,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-condensed',
  },
  colorPurple: {
    color: '#FFFFFF',
    textShadowColor: '#6C63FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  colorTeal: {
    color: '#43C6AC',
    textShadowColor: '#43C6AC',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  underline: {
    height: 4,
    width: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 2,
    marginBottom: 20,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  subText: {
    color: '#9999CC',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 6, // Extremely wide letter spacing for a 'cinematic screen' feel
  }
});

export default SplashScreen;
