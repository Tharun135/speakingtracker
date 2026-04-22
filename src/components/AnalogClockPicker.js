import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, 
  TouchableOpacity, PanResponder, Platform 
} from 'react-native';

const CLOCK_SIZE = 260;
const CENTER = CLOCK_SIZE / 2;

export default function AnalogClockPicker({ visible, onClose, onSelect, value }) {
  const [hours, setHours] = useState(value.getHours() % 12 || 12);
  const [minutes, setMinutes] = useState(value.getMinutes());
  const [period, setPeriod] = useState(value.getHours() >= 12 ? 'PM' : 'AM');
  const [mode, setMode] = useState('hours'); // 'hours' or 'minutes'

  useEffect(() => {
    setHours(value.getHours() % 12 || 12);
    setMinutes(value.getMinutes());
    setPeriod(value.getHours() >= 12 ? 'PM' : 'AM');
    setMode('hours');
  }, [visible, value]);

  const handleDone = () => {
    const finalDate = new Date(value);
    let hNum = hours % 12;
    if (period === 'PM') hNum += 12;
    finalDate.setHours(hNum);
    finalDate.setMinutes(minutes);
    onSelect({}, finalDate);
    onClose();
  };

  const calculateValue = (x, y) => {
    const rx = x - CENTER;
    const ry = y - CENTER;
    let angle = Math.atan2(ry, rx) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360;

    if (mode === 'hours') {
      let h = Math.round(angle / 30) % 12;
      return h === 0 ? 12 : h;
    } else {
      return Math.round(angle / 6) % 60;
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const val = calculateValue(locationX, locationY);
      if (mode === 'hours') setHours(val);
      else setMinutes(val);
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const val = calculateValue(locationX, locationY);
      if (mode === 'hours') setHours(val);
      else setMinutes(val);
    },
    onPanResponderRelease: () => {
      if (mode === 'hours') setMode('minutes');
    },
  });

  const getHandRotation = () => {
    if (mode === 'hours') return `${(hours % 12) * 30}deg`;
    return `${minutes * 6}deg`;
  };

  const renderNumbers = () => {
    const isHours = mode === 'hours';
    return Array.from({ length: 12 }).map((_, i) => {
      const val = isHours ? (i === 0 ? 12 : i) : (i * 5);
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const r = CENTER - 35;
      const x = CENTER + r * Math.cos(angle);
      const y = CENTER + r * Math.sin(angle);
      const isActive = isHours ? (hours % 12 === i % 12) : (minutes === i * 5);

      return (
        <View key={i} style={[styles.numContainer, { left: x - 15, top: y - 15 }, isActive && styles.activeNum]}>
          <Text style={[styles.numText, isActive && styles.activeNumText]}>{val}</Text>
        </View>
      );
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.timeDisplay}>
              <TouchableOpacity onPress={() => setMode('hours')}>
                <Text style={[styles.headerText, mode === 'hours' && styles.activeText]}>
                  {hours.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
              <Text style={styles.separator}>:</Text>
              <TouchableOpacity onPress={() => setMode('minutes')}>
                <Text style={[styles.headerText, mode === 'minutes' && styles.activeText]}>
                  {minutes.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.periodCol}>
              <TouchableOpacity onPress={() => setPeriod('AM')} style={[styles.pBtn, period === 'AM' && styles.pActive]}>
                <Text style={[styles.pText, period === 'AM' && styles.pTextActive]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPeriod('PM')} style={[styles.pBtn, period === 'PM' && styles.pActive]}>
                <Text style={[styles.pText, period === 'PM' && styles.pTextActive]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.clockBody} {...panResponder.panHandlers}>
            <View style={styles.clockFace}>
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {renderNumbers()}
                <View style={[styles.hand, { transform: [{ rotate: getHandRotation() }] }]}>
                  <View style={styles.handLine} />
                  <View style={styles.handKnob} />
                </View>
                <View style={styles.centerDot} />
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.fBtn}><Text style={styles.fText}>CANCEL</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleDone} style={[styles.fBtn, styles.okBtn]}><Text style={styles.okText}>OK</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  content: { backgroundColor: '#1A1A2E', borderRadius: 30, width: 330, padding: 25, borderWidth: 1, borderColor: '#2A2A4A', alignItems: 'center' },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, backgroundColor: '#0F0F1A', padding: 15, borderRadius: 20 },
  timeDisplay: { flexDirection: 'row', alignItems: 'center' },
  headerText: { fontSize: 48, fontWeight: '900', color: '#444' },
  activeText: { color: '#6C63FF' },
  separator: { fontSize: 40, color: '#222', marginHorizontal: 5 },
  periodCol: { gap: 5 },
  pBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  pActive: { backgroundColor: '#6C63FF22' },
  pText: { fontSize: 14, fontWeight: '800', color: '#444' },
  pTextActive: { color: '#6C63FF' },
  clockBody: { width: CLOCK_SIZE, height: CLOCK_SIZE },
  clockFace: { width: '100%', height: '100%', borderRadius: CENTER, backgroundColor: '#0F0F1A', borderWidth: 1, borderColor: '#2A2A4A' },
  numContainer: { position: 'absolute', width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  activeNum: { backgroundColor: '#6C63FF', borderRadius: 15 },
  numText: { color: '#444', fontSize: 13, fontWeight: '800' },
  activeNumText: { color: '#fff' },
  hand: { position: 'absolute', width: 4, height: CENTER, left: CENTER - 2, top: 0, justifyContent: 'flex-start', alignItems: 'center' },
  handLine: { width: 2, height: CENTER - 20, backgroundColor: '#6C63FF', position: 'absolute', top: 20 },
  handKnob: { width: 34, height: 34, backgroundColor: '#6C63FF', borderRadius: 17, position: 'absolute', top: -5 },
  centerDot: { width: 8, height: 8, backgroundColor: '#6C63FF', borderRadius: 4, position: 'absolute', left: CENTER - 4, top: CENTER - 4 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%', gap: 20, marginTop: 25 },
  fBtn: { padding: 10 },
  fText: { color: '#555', fontWeight: '800', fontSize: 14 },
  okText: { color: '#6C63FF', fontWeight: '900' },
});
