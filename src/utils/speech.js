import * as Speech from 'expo-speech';
import { getAppSettings } from './storage';

export const getPreferredVoiceOptions = async () => {
    const settings = await getAppSettings();
    let voices = await Speech.getAvailableVoicesAsync() || [];
    
    // Web browsers sometimes take a moment to load voices
    if (voices.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
      voices = await Speech.getAvailableVoicesAsync() || [];
    }
    
    const options = {
      pitch: 1.0,
      rate: 0.9,
    };

    if (settings.voiceGender) {
      const enVoices = voices.filter(v => (v.language || '').toLowerCase().startsWith('en'));
      const maleNames = ['male', 'alex', 'david', 'george', 'guy', 'daniel', 'arthur', 'mark', 'james', 'richard', 'pavel', 'google uk english male', 'us english male', 'en-us-x-sfg-local', 'en-us-x-iom-local', 'en-au-x-aub-local', 'en-gb-x-gbc-local', 'microsoft david', 'microsoft james', 'microsoft richard'];
      const femaleNames = ['female', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'zira', 'hazel', 'susan', 'sally', 'heera', 'google uk english female', 'us english female', 'en-us-x-tpf-local', 'en-us-x-ana-local', 'en-au-x-aud-local', 'en-gb-x-gbb-local', 'microsoft zira', 'microsoft hazel', 'microsoft susan'];

      let preferredVoice = null;
      const findVoice = (names) => enVoices.find(v => {
        const name = (v.name || '').toLowerCase();
        return names.some(n => name.includes(n));
      });

      if (settings.voiceGender === 'masculine') {
         preferredVoice = findVoice(maleNames);
      } else {
         preferredVoice = findVoice(femaleNames);
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
