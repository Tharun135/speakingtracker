import * as Speech from 'expo-speech';
import { getAppSettings } from './storage';

export const speak = async (text) => {
  try {
    const settings = await getAppSettings();
    const voices = await Speech.getAvailableVoicesAsync();
    
    // Simplistic selection: try to find a voice of the requested gender
    // In a real app, we'd let user pick the exact voice from a list
    const options = {
      pitch: 1.0,
      rate: 0.9, // Slightly slower for better clarity
    };

    if (settings.voiceGender) {
      const preferredVoice = voices.find(v => 
        v.language.startsWith('en') && 
        v.quality === 'Enhanced' && 
        ((settings.voiceGender === 'masculine' && (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('daniel'))) ||
         (settings.voiceGender === 'feminine' && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha'))))
      );
      if (preferredVoice) {
        options.voice = preferredVoice.identifier;
      }
    }

    Speech.speak(text, options);
  } catch (e) {
    console.error('Speech Error', e);
  }
};

export const stopSpeech = () => {
  Speech.stop();
};
