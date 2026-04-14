import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { SPEAK_BETTER_DATA } from '../data/speakBetterData';
import { DAILY_100_SENTENCES } from '../data/conversationData';
import { NATIVE_PHRASES, IDIOMS_DATA, WORKPLACE_ENGLISH, SMART_RESPONSES } from '../data/advancedLinguisticData';

const { width } = Dimensions.get('window');

const MAIN_TABS = [
  { id: 'DAILY', title: 'Daily Sentences', icon: '📅' },
  { id: 'NATIVE', title: 'Native Phrases', icon: '🗣️' },
  { id: 'IDIOM', title: 'Idioms', icon: '💡' },
  { id: 'WORK', title: 'Workplace English', icon: '💼' },
  { id: 'REPLACE', title: 'Replace Word', icon: '✨' },
  { id: 'SMART', title: 'Smart Responses', icon: '🧠' },
];

export default function SpeakBetterScreen() {
  const [activeTab, setActiveTab] = useState('DAILY');
  const [activeCategory, setActiveCategory] = useState('');
  const mainTabScrollRef = useRef(null);

  // Set initial category when tab changes
  useEffect(() => {
    switch (activeTab) {
      case 'DAILY': setActiveCategory(DAILY_100_SENTENCES[0].category); break;
      case 'NATIVE': setActiveCategory(NATIVE_PHRASES[0].category); break;
      case 'IDIOM': setActiveCategory(IDIOMS_DATA[0].category); break;
      case 'WORK': setActiveCategory(WORKPLACE_ENGLISH[0].category); break;
      case 'REPLACE': setActiveCategory(SPEAK_BETTER_DATA[0].title); break;
      case 'SMART': setActiveCategory(SMART_RESPONSES[0].category); break;
    }
  }, [activeTab]);

  const renderTabHeader = () => (
    <View style={styles.tabHeaderContainer}>
      <ScrollView 
        ref={mainTabScrollRef}
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.mainTabContent}
      >
        {MAIN_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[
              styles.mainTab,
              activeTab === tab.id && styles.activeMainTab
            ]}
          >
            <Text style={styles.mainTabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.mainTabText,
              activeTab === tab.id && styles.activeMainTabText
            ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCategoryChips = (data, keyName) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContent}>
      {data.map((item) => (
        <TouchableOpacity 
          key={item[keyName]} 
          onPress={() => setActiveCategory(item[keyName])} 
          style={[styles.chip, activeCategory === item[keyName] && styles.activeChip]}
        >
          <Text style={[styles.chipText, activeCategory === item[keyName] && styles.activeChipText]}>{item[keyName]}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderFromToCard = (item, index, labels = { from: 'DIRECT / HARSH', to: 'NATURAL / POLITE' }) => (
    <View key={index} style={styles.itemCard}>
      <View style={styles.fromRow}>
        <Text style={styles.fromLabel}>{labels.from}</Text>
        <Text style={styles.fromText}>{item.from}</Text>
      </View>
      <View style={styles.arrowRow}>
        <View style={styles.dotLine} />
        <View style={styles.arrowCircle}><Text style={styles.arrowIcon}>↓</Text></View>
        <View style={styles.dotLine} />
      </View>
      <View style={styles.toRow}>
        <Text style={[styles.toLabel, { color: '#43C6AC' }]}>{labels.to}</Text>
        <Text style={styles.toText}>{item.to}</Text>
      </View>
    </View>
  );

  const renderPhraseMeaningCard = (item, index, color = '#6C63FF') => (
    <View key={index} style={[styles.phraseCard, { borderLeftColor: color }]}>
       <View style={styles.phraseHeader}>
          <Text style={styles.phraseMain}>{item.phrase || item.word}</Text>
          <TouchableOpacity style={styles.miniSpeak}>
             <Text style={{fontSize: 12}}>🔊</Text>
          </TouchableOpacity>
       </View>
       <View style={styles.meaningBox}>
          <Text style={styles.meaningLabel}>Meaning</Text>
          <Text style={styles.meaningText}>{item.meaning || item.def}</Text>
       </View>
    </View>
  );

  const renderContent = () => {
    let contentData = [];
    let renderItem = null;

    switch (activeTab) {
      case 'DAILY':
        const dailyCat = DAILY_100_SENTENCES.find(c => c.category === activeCategory) || DAILY_100_SENTENCES[0];
        return (
          <View style={{ flex: 1 }}>
            {renderCategoryChips(DAILY_100_SENTENCES, 'category')}
            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {dailyCat.sentences.map((s, i) => (
                <View key={i} style={styles.sentenceItem}>
                   <Text style={styles.sentenceIndex}>{i + 1}</Text>
                   <Text style={styles.sentenceText}>{s}</Text>
                   <TouchableOpacity style={styles.sentenceSpeak}><Text style={{fontSize: 14}}>🔊</Text></TouchableOpacity>
                </View>
              ))}
              <View style={{ height: 120 }} />
            </ScrollView>
          </View>
        );

      case 'NATIVE':
        const nativeCat = NATIVE_PHRASES.find(c => c.category === activeCategory) || NATIVE_PHRASES[0];
        return (
          <View style={{ flex: 1 }}>
            {renderCategoryChips(NATIVE_PHRASES, 'category')}
            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {nativeCat.items.map((item, i) => renderPhraseMeaningCard(item, i, '#43C6AC'))}
              <View style={{ height: 120 }} />
            </ScrollView>
          </View>
        );

      case 'IDIOM':
        const idiomCat = IDIOMS_DATA.find(c => c.category === activeCategory) || IDIOMS_DATA[0];
        return (
          <View style={{ flex: 1 }}>
            {renderCategoryChips(IDIOMS_DATA, 'category')}
            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {idiomCat.items.map((item, i) => renderPhraseMeaningCard(item, i, '#F7971E'))}
              <View style={{ height: 120 }} />
            </ScrollView>
          </View>
        );

      case 'WORK':
        const workCat = WORKPLACE_ENGLISH.find(c => c.category === activeCategory) || WORKPLACE_ENGLISH[0];
        return (
          <View style={{ flex: 1 }}>
            {renderCategoryChips(WORKPLACE_ENGLISH, 'category')}
            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {workCat.items.map((item, i) => 
                item.to ? renderFromToCard(item, i, { from: 'INFORMAL', to: 'PROFESSIONAL' }) : renderPhraseMeaningCard(item, i, '#6C63FF')
              )}
              <View style={{ height: 120 }} />
            </ScrollView>
          </View>
        );

      case 'REPLACE':
        const replaceCat = SPEAK_BETTER_DATA.find(c => c.title === activeCategory) || SPEAK_BETTER_DATA[0];
        return (
          <View style={{ flex: 1 }}>
            {renderCategoryChips(SPEAK_BETTER_DATA, 'title')}
            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {replaceCat.items.map((item, i) => renderFromToCard(item, i))}
              <View style={{ height: 120 }} />
            </ScrollView>
          </View>
        );

      case 'SMART':
        const smartCat = SMART_RESPONSES.find(c => c.category === activeCategory) || SMART_RESPONSES[0];
        return (
          <View style={{ flex: 1 }}>
            {renderCategoryChips(SMART_RESPONSES, 'category')}
            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {smartCat.items.map((item, i) => renderFromToCard(item, i, { from: 'BASIC', to: 'SMART / NATURAL' }))}
              <View style={{ height: 120 }} />
            </ScrollView>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>💬 Speak Better</Text>
        <Text style={styles.subtitle}>Sound like a native speaker today</Text>
      </View>

      {renderTabHeader()}

      <View style={styles.contentWrapper}>
        {renderContent()}
      </View>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 15 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: '#9999CC', fontSize: 13, marginTop: 4, fontWeight: '700', opacity: 0.8 },
  
  tabHeaderContainer: { marginVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1C1C36' },
  mainTabContent: { paddingHorizontal: 20, paddingBottom: 10, gap: 12 },
  mainTab: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C36', 
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, gap: 8,
    borderWidth: 1, borderColor: '#2A2A4A'
  },
  activeMainTab: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  mainTabIcon: { fontSize: 14 },
  mainTabText: { color: '#B0B0D0', fontSize: 11, fontWeight: '800' },
  activeMainTabText: { color: '#fff' },

  contentWrapper: { flex: 1 },
  
  chipScroll: { flexGrow: 0, marginVertical: 12 },
  chipContent: { paddingHorizontal: 20, gap: 8 },
  chip: { backgroundColor: '#1C1C36', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#2A2A4A' },
  activeChip: { backgroundColor: '#6C63FF22', borderColor: '#6C63FF' },
  chipText: { color: '#9999CC', fontSize: 12, fontWeight: '800' },
  activeChipText: { color: '#fff' },

  scrollArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  
  // From -> To Card
  itemCard: { backgroundColor: '#1C1C36', borderRadius: 22, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A4A' },
  fromRow: { opacity: 0.7 },
  fromLabel: { color: '#FF6584', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  fromText: { color: '#B0B0D0', fontSize: 15, fontWeight: '600', textDecorationLine: 'line-through' },
  arrowRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8, gap: 10 },
  dotLine: { flex: 1, height: 1, backgroundColor: '#2A2A4A', borderStyle: 'dashed' },
  arrowCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#2A2A4A', justifyContent: 'center', alignItems: 'center' },
  arrowIcon: { color: '#6C63FF', fontSize: 10, fontWeight: '900' },
  toRow: { },
  toLabel: { color: '#43C6AC', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  toText: { color: '#fff', fontSize: 18, fontWeight: '900' },

  // Phrase -> Meaning Card
  phraseCard: { backgroundColor: '#1C1C36', borderRadius: 20, padding: 18, marginBottom: 14, borderLeftWidth: 4, borderWidth: 1, borderColor: '#2A2A4A' },
  phraseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  phraseMain: { color: '#fff', fontSize: 18, fontWeight: '900' },
  miniSpeak: { width: 30, height: 30, backgroundColor: '#2A2A4A', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  meaningBox: { borderTopWidth: 1, borderTopColor: '#2A2A4A', paddingTop: 10 },
  meaningLabel: { color: '#9999CC', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginBottom: 2 },
  meaningText: { color: '#E0E0FF', fontSize: 14, lineHeight: 20, fontWeight: '500' },

  // Sentence Item
  sentenceItem: { backgroundColor: '#1E1B38', borderRadius: 18, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#2A2A4A' },
  sentenceIndex: { color: '#6C63FF', fontWeight: '900', fontSize: 12, width: 20 },
  sentenceText: { color: '#fff', fontSize: 15, flex: 1, fontWeight: '600' },
  sentenceSpeak: { padding: 8, backgroundColor: '#2A2A4A', borderRadius: 10 },
});
