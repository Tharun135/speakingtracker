import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';


const KEYS = {
  COMPLETED_DAYS: 'completed_days',
  PHASE_STEPS: 'phase_steps',
  START_DATE: 'start_date',
  DAY_ANALYSES: 'day_analyses',
  XP: 'user_xp',
  PROFILE: 'user_profile',
  VOCAB_BANK: 'vocab_bank',
  SRS_DATA: 'srs_data',
  ACHIEVEMENTS: 'user_achievements',
  STUCK_WORDS: 'stuck_words',
  CHUNKS: 'vocab_chunks',
  FAVORITES: 'vocab_favorites',
  JOURNAL: 'speaking_journal',
  MISSION: 'daily_mission',
  SETTINGS: 'app_settings',
};

export const saveDayAnalysis = async (day, analysis) => {
  const all = await getDayAnalyses();
  all[day] = analysis;
  await AsyncStorage.setItem(KEYS.DAY_ANALYSES, JSON.stringify(all));
};

export const getDayAnalyses = async () => {
  try {
    const val = await AsyncStorage.getItem(KEYS.DAY_ANALYSES);
    return val ? JSON.parse(val) : {};
  } catch { return {}; }
};

// Completed days (Set of day numbers 1-30)
export const getCompletedDays = async () => {
  try {
    const val = await AsyncStorage.getItem(KEYS.COMPLETED_DAYS);
    return val ? new Set(JSON.parse(val)) : new Set();
  } catch { return new Set(); }
};

export const toggleDay = async (day) => {
  const days = await getCompletedDays();
  if (day === -1) {
    days.clear();
  } else {
    if (days.has(day)) days.delete(day); else days.add(day);
  }
  await AsyncStorage.setItem(KEYS.COMPLETED_DAYS, JSON.stringify([...days]));
  return days;
};

export const resetCompletedDays = async () => {
  await AsyncStorage.setItem(KEYS.COMPLETED_DAYS, JSON.stringify([]));
  return new Set();
};

export const saveCompletedDays = async (days) => {
  await AsyncStorage.setItem(KEYS.COMPLETED_DAYS, JSON.stringify([...days]));
};

// Phase steps { phaseId: Set of completed step indices }
export const getPhaseSteps = async () => {
  try {
    const val = await AsyncStorage.getItem(KEYS.PHASE_STEPS);
    if (!val) return {};
    const raw = JSON.parse(val);
    const result = {};
    for (const k in raw) result[k] = new Set(raw[k]);
    return result;
  } catch { return {}; }
};

export const togglePhaseStep = async (phaseId, stepIndex) => {
  const steps = await getPhaseSteps();
  if (!steps[phaseId]) steps[phaseId] = new Set();
  if (steps[phaseId].has(stepIndex)) steps[phaseId].delete(stepIndex);
  else steps[phaseId].add(stepIndex);
  const raw = {};
  for (const k in steps) raw[k] = [...steps[k]];
  await AsyncStorage.setItem(KEYS.PHASE_STEPS, JSON.stringify(raw));
  return steps;
};

// Start date
export const getStartDate = async () => {
  const val = await AsyncStorage.getItem(KEYS.START_DATE);
  if (!val) {
    const now = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.START_DATE, now);
    return now;
  }
  return val;
};

// Clear all
export const clearAll = async () => {
  await AsyncStorage.multiRemove(Object.values(KEYS));
};

// Streak calculation
export const calculateStreak = (completedDays) => {
  let streak = 0;
  for (let i = 1; i <= 30; i++) {
    if (completedDays.has(i)) streak++;
    else break;
  }
  return streak;
};

export const getReminderTime = async () => {
  try {
    const val = await AsyncStorage.getItem('reminder_time');
    return val ? new Date(val) : (() => { const d = new Date(); d.setHours(9, 0, 0, 0); return d; })();
  } catch { const d = new Date(); d.setHours(9, 0, 0, 0); return d; }
};

export const saveReminderTime = async (date) => {
  await AsyncStorage.setItem('reminder_time', date.toISOString());
};

// XP & Leveling
export const getXP = async () => {
  const val = await AsyncStorage.getItem(KEYS.XP);
  return val ? parseInt(val, 10) : 0;
};

export const addXP = async (amount) => {
  const current = await getXP();
  const next = current + amount;
  await AsyncStorage.setItem(KEYS.XP, next.toString());
  return next;
};

// Profile & Personalization
export const getProfile = async () => {
  const val = await AsyncStorage.getItem(KEYS.PROFILE);
  return val ? JSON.parse(val) : null;
};

export const saveProfile = async (profile) => {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
};

// Vocabulary Bank
export const getVocabBank = async () => {
  const val = await AsyncStorage.getItem(KEYS.VOCAB_BANK);
  return val ? JSON.parse(val) : [];
};

export const addToVocabBank = async (wordData) => {
  const bank = await getVocabBank();
  if (!bank.find(w => w.word.toLowerCase() === wordData.word.toLowerCase())) {
    bank.push({ ...wordData, dateAdded: new Date().toISOString() });
    await AsyncStorage.setItem(KEYS.VOCAB_BANK, JSON.stringify(bank));
  }
  return bank;
};

// SRS Algorithm (Simplified SM-2)
export const updateSRS = async (word, grade) => {
  const val = await AsyncStorage.getItem(KEYS.SRS_DATA);
  const data = val ? JSON.parse(val) : {};
  
  let entry = data[word] || {
    repetition: 0,
    interval: 1,
    easeFactor: 2.5,
  };

  if (grade >= 3) {
    if (entry.repetition === 0) entry.interval = 1;
    else if (entry.repetition === 1) entry.interval = 6;
    else entry.interval = Math.round(entry.interval * entry.easeFactor);
    entry.repetition++;
  } else {
    entry.repetition = 0;
    entry.interval = 1;
  }

  entry.easeFactor = entry.easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (entry.easeFactor < 1.3) entry.easeFactor = 1.3;
  
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + entry.interval);
  entry.nextReview = nextReview.toISOString();

  data[word] = entry;
  await AsyncStorage.setItem(KEYS.SRS_DATA, JSON.stringify(data));
  return data;
};

export const getSRSData = async () => {
  const val = await AsyncStorage.getItem(KEYS.SRS_DATA);
  return val ? JSON.parse(val) : {};
};

// Stuck Words
export const getStuckWords = async () => {
  const val = await AsyncStorage.getItem(KEYS.STUCK_WORDS);
  return val ? JSON.parse(val) : [];
};

export const markAsStuck = async (wordData) => {
  const stuck = await getStuckWords();
  if (!stuck.find(s => s.word.toLowerCase() === wordData.word.toLowerCase())) {
    stuck.push({ ...wordData, attempts: 1, lastAttempt: new Date().toISOString() });
  } else {
    const idx = stuck.findIndex(s => s.word.toLowerCase() === wordData.word.toLowerCase());
    stuck[idx].attempts += 1;
    stuck[idx].lastAttempt = new Date().toISOString();
  }
  await AsyncStorage.setItem(KEYS.STUCK_WORDS, JSON.stringify(stuck));
  return stuck;
};

export const removeFromStuck = async (word) => {
  const stuck = await getStuckWords();
  const filtered = stuck.filter(s => s.word.toLowerCase() !== word.toLowerCase());
  await AsyncStorage.setItem(KEYS.STUCK_WORDS, JSON.stringify(filtered));
  return filtered;
};

// Chunk Library
export const getChunks = async () => {
  const val = await AsyncStorage.getItem(KEYS.CHUNKS);
  return val ? JSON.parse(val) : [
    { phrase: "To be honest...", category: "Fillers", usage: "Used to add emphasis or sincerity." },
    { phrase: "What I mean is...", category: "Clarification", usage: "Used when you need to explain further." },
    { phrase: "That reminds me of...", category: "Transitions", usage: "Used to shift topics naturally." },
    { phrase: "I'm not sure but I think...", category: "Hesitation", usage: "Polite way to express uncertainty." },
  ];
};

export const addChunk = async (chunk) => {
  const chunks = await getChunks();
  chunks.push(chunk);
  await AsyncStorage.setItem(KEYS.CHUNKS, JSON.stringify(chunks));
};

// Favorites (Bi-Heart)
export const getFavorites = async () => {
  const val = await AsyncStorage.getItem(KEYS.FAVORITES);
  return val ? JSON.parse(val) : [];
};

export const toggleFavorite = async (word) => {
  const favs = await getFavorites();
  const exists = favs.includes(word);
  const nextFavs = exists ? favs.filter(f => f !== word) : [...favs, word];
  await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(nextFavs));
  return nextFavs;
};

// Journal (30-Day Growth)
export const getJournalHistory = async () => {
  const val = await AsyncStorage.getItem(KEYS.JOURNAL);
  return val ? JSON.parse(val) : [];
};

export const saveToJournal = async (analysis, audioUri) => {
  try {
    const history = await getJournalHistory();
    const fileName = `recording_${Date.now()}.m4a`;
    const newPath = `${FileSystem.documentDirectory}Journal/${fileName}`;
    
    const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}Journal`);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}Journal`, { intermediates: true });
    }
    
    await FileSystem.copyAsync({ from: audioUri, to: newPath });
    
    const entry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      transcript: analysis.transcript,
      score: analysis.fluencyScore,
      pronunciation: analysis.pronunciation,
      metrics: analysis.metrics,
      coaching: analysis.coaching,
      audioPath: newPath
    };
    
    const updatedHistory = [entry, ...history];
    await AsyncStorage.setItem(KEYS.JOURNAL, JSON.stringify(updatedHistory));
    
    // Auto-delete check
    await autoDeleteOldJournalEntries(updatedHistory);
    return entry;
  } catch (e) { console.error('Journal Save Error', e); return null; }
};

const autoDeleteOldJournalEntries = async (history) => {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const toKeep = [];
  const toDelete = [];

  history.forEach(item => {
    if (new Date(item.date).getTime() > thirtyDaysAgo) {
      toKeep.push(item);
    } else {
      toDelete.push(item);
    }
  });

  for (const item of toDelete) {
    try { await FileSystem.deleteAsync(item.audioPath, { idempotent: true }); } catch (e) {}
  }

  if (toDelete.length > 0) {
    await AsyncStorage.setItem(KEYS.JOURNAL, JSON.stringify(toKeep));
  }
};

// Missions
export const getMissionState = async () => {
  const val = await AsyncStorage.getItem(KEYS.MISSION);
  return val ? JSON.parse(val) : null;
};

export const saveMission = async (mission) => {
  const state = { ...mission, progress: 0, lastUpdated: new Date().toISOString() };
  await AsyncStorage.setItem(KEYS.MISSION, JSON.stringify(state));
  return state;
};

export const updateMissionProgress = async (increment = 1) => {
  const state = await getMissionState();
  if (!state) return null;
  state.progress = Math.min(state.progress + increment, state.targetCount);
  await AsyncStorage.setItem(KEYS.MISSION, JSON.stringify(state));
  return state;
};

// Settings
export const getAppSettings = async () => {
  const val = await AsyncStorage.getItem(KEYS.SETTINGS);
  return val ? JSON.parse(val) : { voiceGender: 'feminine' };
};

export const saveAppSettings = async (settings) => {
  const current = await getAppSettings();
  const next = { ...current, ...settings };
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(next));
};
