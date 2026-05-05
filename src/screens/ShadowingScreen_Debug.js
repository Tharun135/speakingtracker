import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

export default function ShadowingScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Shadowing Screen Loaded!</Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, alignItems: 'center' },
  text: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  button: { backgroundColor: '#6C63FF', padding: 15, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});
