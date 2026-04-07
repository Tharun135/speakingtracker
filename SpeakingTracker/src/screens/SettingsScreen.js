import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';
import { saveReminderTime, getReminderTime, getAppSettings, saveAppSettings, getJournalHistory } from '../utils/storage';

export default function SettingsScreen({ profile }) {
  const [time, setTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [voiceGender, setVoiceGender] = useState('feminine');
  const [storageSize, setStorageSize] = useState('0 MB');

  useEffect(() => {
    loadSettings();
    calculateStorage();
  }, []);

  const loadSettings = async () => {
    const rTime = await getReminderTime();
    setTime(rTime);
    const settings = await getAppSettings();
    setVoiceGender(settings.voiceGender || 'feminine');
    const { status } = await Notifications.getPermissionsAsync();
    setRemindersEnabled(status === 'granted');
  };

  const calculateStorage = async () => {
    try {
      const history = await getJournalHistory();
      let total = 0;
      for (const item of history) {
        const info = await FileSystem.getInfoAsync(item.audioPath);
        if (info.exists) total += info.size;
      }
      setStorageSize((total / (1024 * 1024)).toFixed(1) + ' MB');
    } catch (e) {
      setStorageSize('0 MB');
    }
  };

  const handleTimeChange = async (event, selectedDate) => {
    setShowPicker(false);
    if (!selectedDate) return;
    setTime(selectedDate);
    await saveReminderTime(selectedDate);
    await scheduleNotification(selectedDate);
  };

  const scheduleNotification = async (targetDate) => {
    if (!remindersEnabled) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎙️ Speaking time!",
          body: "Your daily 2-minute practice is ready. Open the tracker.",
          sound: true,
          priority: Notifications.AndroidImportance.MAX,
        },
        trigger: {
          hour: targetDate.getHours(),
          minute: targetDate.getMinutes(),
          repeats: true,
          channelId: 'default'
        },
      });
      Alert.alert("Reminder Set!", `You'll be notified daily at ${targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
    } catch (e) {
      console.error('Notification Error:', e);
      Alert.alert('Error', 'Could not schedule reminder. Please check permission settings.');
    }
  };

  const toggleVoice = async (gender) => {
    setVoiceGender(gender);
    await saveAppSettings({ voiceGender: gender });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSub}>Customize your AI Language Coach</Text>
      </View>

      <Text style={styles.sectionHeader}>Habit Triggers</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Daily Reminders</Text>
            <Text style={styles.subtext}>Push notifications to speak</Text>
          </View>
          <Switch 
            value={remindersEnabled} 
            onValueChange={async (val) => {
              if (val) {
                const { status } = await Notifications.requestPermissionsAsync();
                setRemindersEnabled(status === 'granted');
              } else {
                setRemindersEnabled(false);
                await Notifications.cancelAllScheduledNotificationsAsync();
              }
            }} 
            trackColor={{ false: '#2A2A4A', true: '#6C63FF' }}
            thumbColor={'#fff'}
          />
        </View>

        {remindersEnabled && (
          <TouchableOpacity onPress={() => setShowPicker(true)} style={[styles.row, { borderTopWidth: 1, borderTopColor: '#2A2A4A', paddingTop: 15, marginBottom: 0 }]}>
            <View>
              <Text style={styles.label}>Reminder Time</Text>
              <Text style={styles.subtext}>Current: {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <View style={styles.timeBtn}>
              <Text style={styles.timeText}>Change</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionHeader}>AI Practice Voice</Text>
      <View style={styles.card}>
        <View style={styles.genderRow}>
          <TouchableOpacity 
            style={[styles.genderBtn, voiceGender === 'feminine' && styles.genderBtnActive]} 
            onPress={() => toggleVoice('feminine')}
          >
            <Text style={[styles.genderText, voiceGender === 'feminine' && styles.genderTextActive]}>👩 Feminine</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.genderBtn, voiceGender === 'masculine' && styles.genderBtnActive]} 
            onPress={() => toggleVoice('masculine')}
          >
            <Text style={[styles.genderText, voiceGender === 'masculine' && styles.genderTextActive]}>👨 Masculine</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subNote}>This voice will be used for vocabulary and roleplay simulations.</Text>
      </View>

      <Text style={styles.sectionHeader}>Storage & Privacy</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>30-Day Auto-Delete</Text>
            <Text style={styles.subtext}>Currently using {storageSize}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>ACTIVE</Text>
          </View>
        </View>
        <Text style={styles.subNote}>Recordings older than 30 days are automatically removed to save space.</Text>
      </View>

      {showPicker && (
        <DateTimePicker
          value={time}
          mode="time"
          is24Hour={true}
          onChange={handleTimeChange}
        />
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  header: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 30 },
  headerTitle: { color: '#fff', fontSize: 32, fontWeight: '900' },
  headerSub: { color: '#9999CC', fontSize: 13, marginTop: 4, fontWeight: '600' },
  
  sectionHeader: { color: '#6C63FF', fontSize: 11, fontWeight: '900', paddingHorizontal: 24, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: '#1A1A2E', marginHorizontal: 16, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#2A2A4A', marginBottom: 30 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  label: { color: '#fff', fontSize: 16, fontWeight: '700' },
  subtext: { color: '#6666AA', fontSize: 12, marginTop: 2 },
  
  timeBtn: { backgroundColor: '#2A2A4A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  timeText: { color: '#6C63FF', fontWeight: '800', fontSize: 12 },

  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  genderBtn: { flex: 1, backgroundColor: '#0F0F1A', paddingVertical: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A4A' },
  genderBtnActive: { backgroundColor: '#6C63FF33', borderColor: '#6C63FF' },
  genderText: { color: '#B0B0D0', fontWeight: '700' },
  genderTextActive: { color: '#fff' },
  
  statusBadge: { backgroundColor: '#EAF3DE11', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#97C45933' },
  statusText: { color: '#97C459', fontSize: 10, fontWeight: '900' },
  subNote: { color: '#555588', fontSize: 11, lineHeight: 16 },
});
