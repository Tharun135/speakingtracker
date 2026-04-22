import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';

export default function WebTimePicker({ visible, value, onSelect, onClose }) {
  const [hours, setHours] = useState(value.getHours().toString().padStart(2, '0'));
  const [minutes, setMinutes] = useState(value.getMinutes().toString().padStart(2, '0'));

  const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleConfirm = () => {
    const newDate = new Date(value);
    newDate.setHours(parseInt(hours));
    newDate.setMinutes(parseInt(minutes));
    onSelect({}, newDate);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.pickerCard}>
          <Text style={styles.title}>Set Reminder Time</Text>
          
          <View style={styles.columns}>
            <View style={styles.column}>
              <Text style={styles.label}>HOUR</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {HOURS.map(h => (
                  <TouchableOpacity 
                    key={h} 
                    onPress={() => setHours(h)}
                    style={[styles.item, hours === h && styles.activeItem]}
                  >
                    <Text style={[styles.itemText, hours === h && styles.activeItemText]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.separator}>:</Text>

            <View style={styles.column}>
              <Text style={styles.label}>MIN</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {MINUTES.map(m => (
                  <TouchableOpacity 
                    key={m} 
                    onPress={() => setMinutes(m)}
                    style={[styles.item, minutes === m && styles.activeItem]}
                  >
                    <Text style={[styles.itemText, minutes === m && styles.activeItemText]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  pickerCard: { backgroundColor: '#1A1A2E', borderRadius: 30, width: 330, padding: 25, borderWidth: 1, borderColor: '#2A2A4A' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  columns: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 200 },
  column: { flex: 1, alignItems: 'center' },
  scroll: { width: '100%' },
  label: { color: '#6C63FF', fontSize: 10, fontWeight: '900', marginBottom: 10, letterSpacing: 1 },
  item: { paddingVertical: 10, alignItems: 'center', borderRadius: 10, marginVertical: 2 },
  activeItem: { backgroundColor: '#6C63FF22' },
  itemText: { color: '#666', fontSize: 20, fontWeight: '700' },
  activeItemText: { color: '#6C63FF', fontSize: 24, fontWeight: '900' },
  separator: { color: '#6C63FF', fontSize: 32, fontWeight: '900', marginTop: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, gap: 15 },
  cancelBtn: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  confirmBtn: { flex: 2, backgroundColor: '#6C63FF', paddingVertical: 15, borderRadius: 15, alignItems: 'center' },
  cancelText: { color: '#666', fontWeight: '700' },
  confirmText: { color: '#fff', fontWeight: '800' }
});;
