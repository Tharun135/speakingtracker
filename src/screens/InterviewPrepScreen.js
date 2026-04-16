import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { getPreferredVoiceOptions } from '../utils/speech';
import { INTERVIEW_QUESTIONS, VOCABULARY_UPGRADES, AGILE_GLOSSARY } from '../data/interviewData';

export default function InterviewPrepScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Commute Mode state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(-1);
  const isPlayingRef = useRef(false);
  const timeoutRef = useRef(null);

  // Scroll functionality
  const scrollViewRef = useRef(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Stop audio and clear timeouts when leaving the screen
  useEffect(() => {
    return () => {
      Speech.stop();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const categories = ['All', ...Array.from(new Set(INTERVIEW_QUESTIONS.map(q => q.category)))];

  const filteredQuestions = selectedCategory === 'All' 
    ? INTERVIEW_QUESTIONS 
    : INTERVIEW_QUESTIONS.filter(q => q.category === selectedCategory);

  const togglePlay = () => {
    if (isPlayingRef.current) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setPlayingIndex(-1);
      Speech.stop();
      if(timeoutRef.current) clearTimeout(timeoutRef.current);
    } else {
      isPlayingRef.current = true;
      setIsPlaying(true);
      playSequence(0); // Start from the top of the current list
    }
  };

  const playSequence = async (index) => {
    if (!isPlayingRef.current) return;
    if (index >= filteredQuestions.length) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setPlayingIndex(-1);
      return; // Finished all questions
    }
    
    setPlayingIndex(index);
    const item = filteredQuestions[index];
    const voiceOpts = await getPreferredVoiceOptions();
    
    // Announce the question
    Speech.speak(`Question: ${item.question}`, {
      ...voiceOpts,
      onDone: () => {
        if (!isPlayingRef.current) return;
        
        // Immediately follow with the sample answer
        Speech.speak(`Sample Answer: ${item.sampleAnswer}`, {
          ...voiceOpts,
          onDone: () => {
            if (!isPlayingRef.current) return;
            
            // Give the user a 2.5-second break before the next question starts
            timeoutRef.current = setTimeout(() => {
              playSequence(index + 1);
            }, 2500); 
          }
        });
      }
    });
  };

  const handleCategoryChange = (cat) => {
    // If user changes the filter while it's playing, stop the audio automatically
    // so it doesn't accidentally read questions from the wrong updated list.
    if (isPlayingRef.current) {
      togglePlay();
    }
    setSelectedCategory(cat);
  };

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowBackToTop(offsetY > 400); // Show button after scrolling down 400px
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Interview Prep</Text>
          <TouchableOpacity 
            style={[styles.commuteBtn, isPlaying && styles.commuteBtnActive]} 
            onPress={togglePlay}
          >
            <Text style={styles.commuteText}>
              {isPlaying ? '⏹ Stop Audio' : '🎧 Commute Mode'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Master the STAR Method and sound professional.</Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={true} 
        scrollEventThrottle={16}
        onScroll={handleScroll}
        contentContainerStyle={styles.scrollContent}
      >
        
        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => handleCategoryChange(cat)}
              style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Practice Questions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Practice Questions</Text>
          {filteredQuestions.map((item, index) => (
            <View key={item.id} style={[
              styles.questionCard, 
              playingIndex === index && styles.questionCardActive // Highlight the card that is currently being spoken
            ]}>
              <View style={styles.cardHeader}>
                <Text style={styles.categoryBadge}>{item.category}</Text>
              </View>
              <Text style={styles.questionText}>{item.question}</Text>
              
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>💡 Tips:</Text>
                {item.tips?.map((tip, idx) => (
                  <Text key={idx} style={styles.tipText}>• {tip}</Text>
                ))}
              </View>
              
              <View style={styles.starterContainer}>
                <Text style={styles.starterTitle}>Sample Answer:</Text>
                <Text style={styles.starterText}>{item.sampleAnswer}</Text>
              </View>

              <View style={styles.vocabContainer}>
                <Text style={styles.vocabTitle}>Power Words:</Text>
                <View style={styles.vocabTags}>
                  {item.goodVocab?.map((word, idx) => (
                    <View key={idx} style={styles.vocabTag}>
                      <Text style={styles.vocabTagText}>{word}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Agile Glossary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agile & Scrum Glossary</Text>
          <View style={styles.glossaryContainer}>
            {AGILE_GLOSSARY.map((item, idx) => (
              <View key={idx} style={styles.glossaryCard}>
                <Text style={styles.glossaryTerm}>{item.term}</Text>
                <Text style={styles.glossaryDesc}>{item.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Vocabulary Upgrades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vocabulary Upgrades</Text>
          <View style={styles.upgradeCard}>
            {VOCABULARY_UPGRADES.map((vocab, idx) => (
              <View key={idx} style={styles.upgradeRow}>
                <Text style={styles.basicWord}>Instead of "{vocab.basic}"</Text>
                <Text style={styles.upgradeIcon}>➔</Text>
                <Text style={styles.upgradedWord}>Use "{vocab.upgrade}"</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {showBackToTop && (
        <TouchableOpacity style={styles.backToTopBtn} onPress={scrollToTop}>
          <Text style={styles.backToTopText}>↑</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
  },
  commuteBtn: {
    backgroundColor: '#6C63FF33',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6C63FF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  commuteBtnActive: {
    backgroundColor: '#FF658433', // Turns red when active to signify 'Stop'
    borderColor: '#FF6584',
  },
  commuteText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9999CC',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    marginBottom: 20,
    flexGrow: 0,
  },
  filterChip: {
    backgroundColor: '#1C1C36',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  filterChipActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  filterText: {
    color: '#9999CC',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 15,
  },
  questionCard: {
    backgroundColor: '#1C1C36',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#43C6AC',
  },
  questionCardActive: {
    borderColor: '#6C63FF',
    borderWidth: 2,
    borderLeftWidth: 6,
    borderLeftColor: '#6C63FF',
    backgroundColor: '#25254A', // Visually highlight the playing card
  },
  cardHeader: {
    marginBottom: 10,
  },
  categoryBadge: {
    color: '#43C6AC',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 15,
  },
  tipsContainer: {
    backgroundColor: '#0F0F1A',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  tipsTitle: {
    color: '#FF6584',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  tipText: {
    color: '#B0B0D0',
    fontSize: 13,
    marginBottom: 2,
  },
  starterContainer: {
    marginBottom: 12,
  },
  starterTitle: {
    color: '#9999CC',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  starterText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
  },
  vocabContainer: {},
  vocabTitle: {
    color: '#9999CC',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  vocabTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vocabTag: {
    backgroundColor: '#6C63FF22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vocabTagText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '700',
  },
  upgradeCard: {
    backgroundColor: '#1C1C36',
    borderRadius: 20,
    padding: 20,
  },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A4A',
    paddingBottom: 15,
  },
  basicWord: {
    flex: 1,
    color: '#9999CC',
    fontSize: 14,
  },
  upgradeIcon: {
    color: '#6C63FF',
    marginHorizontal: 10,
  },
  upgradedWord: {
    flex: 1,
    color: '#43C6AC',
    fontSize: 14,
    fontWeight: '700',
  },
  glossaryContainer: {
    gap: 12,
  },
  glossaryCard: {
    backgroundColor: '#1C1C36',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#6C63FF',
  },
  glossaryTerm: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  glossaryDesc: {
    color: '#B0B0D0',
    fontSize: 14,
    lineHeight: 20,
  },
  backToTopBtn: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: '#6C63FF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1A1A2E',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  backToTopText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  }
});
