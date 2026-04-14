import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Platform, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const lockProgress = useRef(new Animated.Value(0)).current;
  
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.9)).current;

  // We use 5 lines to create the "multi-line" waveform look
  const lineCount = 5;
  const lineAnims = Array(lineCount).fill(0).map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    // Stage 1 & 2: Continuous oscillation
    const createOscillation = (anim, delay, speed) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: speed,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: -1,
            duration: speed,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    lineAnims.forEach((anim, i) => {
      createOscillation(anim, i * 150, 1500 + i * 200);
    });

    // Stage 3 & 4: The stabilize and reveal sequence
    Animated.sequence([
      Animated.delay(3500), // Initial wave show time
      Animated.parallel([
        // Stabilize lines
        Animated.timing(lockProgress, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        // Reveal Text
        Animated.sequence([
          Animated.delay(500),
          Animated.parallel([
            Animated.timing(textOpacity, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.spring(textScale, {
              toValue: 1,
              friction: 8,
              useNativeDriver: true,
            }),
          ])
        ]),
      ]),
      Animated.delay(1500),
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onFinish) onFinish();
    });
  }, []);

  const renderWaveLine = (index) => {
    const opacity = (1 - (index / lineCount)) * 0.8;
    const thickness = 3 - (index * 0.4);
    
    // Each line has a slightly different movement range
    const translateY = Animated.multiply(
      lineAnims[index].interpolate({
        inputRange: [-1, 1],
        outputRange: [-40 + index * 5, 40 - index * 5],
      }),
      lockProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0], // Reduces to 0 to stabilize
      })
    );

    return (
      <Animated.View 
        key={index}
        style={[
          styles.waveLine,
          {
            height: thickness,
            opacity: opacity,
            backgroundColor: index % 2 === 0 ? '#00e5ff' : '#ff3ea5',
            transform: [{ translateY }],
            shadowColor: index % 2 === 0 ? '#00e5ff' : '#ff3ea5',
            shadowOpacity: 0.8,
            shadowRadius: 10,
          }
        ]}
      />
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        {/* The Multiline Waveform */}
        <View style={styles.waveWrapper}>
          {lineAnims.map((_, i) => renderWaveLine(i))}
        </View>

        {/* The Text that emerges from the wave center */}
        <Animated.View style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ scale: textScale }]
          }
        ]}>
          <Text style={styles.text}>EchoLab</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0b0b2a',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: width,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveLine: {
    width: width * 0.85,
    borderRadius: 2,
    position: 'absolute',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: -3,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-condensed',
    textAlign: 'center',
    textShadowColor: '#ff4df0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
});

export default SplashScreen;
