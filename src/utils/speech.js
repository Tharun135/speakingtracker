import * as Speech from 'expo-speech';
import { getAppSettings } from './storage';

export const getPreferredVoiceOptions = async () => {
    const settings = await getAppSettings();
    const voices = await Speech.getAvailableVoicesAsync() || [];
    
    const options = {
      pitch: 1.0,
      rate: 0.9,
    };

    if (settings.voiceGender) {
      const enVoices = voices.filter(v => (v.language || '').toLowerCase().startsWith('en'));
      const maleNames = ['male', 'alex', 'david', 'george', 'guy', 'daniel', 'arthur', 'mark', 'google uk english male', 'us english male'];
      const femaleNames = ['female', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'google uk english female', 'us english female'];

      let preferredVoice = null;
      if (settings.voiceGender === 'masculine') {
         preferredVoice = enVoices.find(v => maleNames.some(name => v.name.toLowerCase().includes(name)));
      } else {
         preferredVoice = enVoices.find(v => femaleNames.some(name => v.name.toLowerCase().includes(name)));
      }

      if (!preferredVoice && enVoices.length > 0) {
        preferredVoice = enVoices[0];
      }

      if (preferredVoice) {
        options.voice = preferredVoice.identifier;
      }
    }
    
    return options;
};

export const speak = async (text, overrides = {}) => {
  try {
    const options = await getPreferredVoiceOptions();
    Speech.speak(text, { ...options, ...overrides });
  } catch (e) {
    console.error('Speech Error', e);
  }
};

export const stopSpeech = () => {
  Speech.stop();
};
