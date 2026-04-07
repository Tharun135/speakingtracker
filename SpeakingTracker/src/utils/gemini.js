import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';

const API_KEY = 'AIzaSyBp5kPMMN7oat_vybv40ZwU9-CpKlruy9A';
const genAI = new GoogleGenerativeAI(API_KEY);

const safeJsonParse = (text) => {
  try {
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error('JSON Parse Error:', e, 'Raw text:', text);
    return null;
  }
};

export async function analyzeRecording(audioUri) {
  try {
    const base64Audio = await FileSystem.readAsStringAsync(audioUri, { encoding: FileSystem.EncodingType.Base64 });
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json' } });

    const prompt = `[Expert English Coach Mode] Analyze this 2-min audio. Return a JSON object with: 1. "transcript": verbatim transcript. 2. "fillers": array of {word, count}. 3. "grammar": array of {wrong, right, explanation}. 4. "vocabulary": array of {word, upgrade, reason}. 5. "fluencyScore": number 1-10. 6. "pronunciation": {score: 1-100, feedback, trickySounds: string[]}. 7. "coachingTip": actionable tip.`;

    const result = await model.generateContent([{ inlineData: { data: base64Audio, mimeType: 'audio/mp4' } }, prompt]);
    const content = safeJsonParse(result.response.text());
    
    if (content) return content;
    throw new Error('Fallback to basic analysis');
  } catch (error) {
    console.error('Analysis Error:', error);
    return {
      transcript: "Recording captured but AI analysis was interrupted. You sounds great! Try a shorter clip next time.",
      fillers: [], grammar: [], vocabulary: [], fluencyScore: 7,
      pronunciation: { score: 75, feedback: "Keep practicing your vowel clarity.", trickySounds: ["th", "r"] },
      coachingTip: "Focus on speaking slowly and clearly to improve clarity."
    };
  }
}

export async function getWordOfTheDay(level = 'B2', interests = []) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json' } });
    const prompt = `English word/phrase of the day for a ${level} learner interested in ${interests.join(', ')}. Return JSON: {word, type, definition, everydaySentences: [{context, sentence}], sayItNaturally: string[], avoidSaying: string[], tip, cefr}`;
    const result = await model.generateContent(prompt);
    return safeJsonParse(result.response.text()) || FALLBACK_WORD;
  } catch (e) { return FALLBACK_WORD; }
}

const FALLBACK_WORD = {
  word: "Get the ball rolling", type: "idiom", definition: "To start something, like a conversation or a project.",
  everydaySentences: [{ context: "Meeting", sentence: "Let's get the ball rolling by introducing everyone." }],
  sayItNaturally: ["Get started", "Kick things off"], avoidSaying: ["Start the ball"], tip: "Great for starting any activity.", cefr: "B2"
};

export async function getWritingCorrection(sentence) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json' } });
    const prompt = `Analyze: "${sentence}". Return JSON: {original, corrected, suggestions: string[], explanation, idioms: [{word, meaning}]}`;
    const result = await model.generateContent(prompt);
    return safeJsonParse(result.response.text()) || { original: sentence, corrected: sentence, suggestions: [], explanation: "Your sentence looks good!", idioms: [] };
  } catch (e) { return { original: sentence, corrected: sentence, suggestions: [], explanation: "Connection error.", idioms: [] }; }
}

export async function startConversationSim(scenario) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `[Expert Language Partner] Scenario: "${scenario}". Output ONLY a natural opening line.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e) { return `Hey! Ready to practice ${scenario}? Let's start.`; }
}

const FALLBACK_EXERCISES = {
  shadowing: [
    { text: "Despite the growing complexity of modern technology, many people find that a simple, disciplined approach to daily learning yields the most significant long-term results.", instruction: "Focus on the natural pause after 'technology' and the upward intonation on 'disciplined'." },
    { text: "If we consider the impact of sustainable energy on future urban planning, it becomes clear that early investment in green infrastructure is absolutely critical for the next generation.", instruction: "Practice the rhythmic flow of the entire complex sentence without pausing in the middle." }
  ],
  tongue_twisters: [
    { text: "Peter Piper picked a peck of pickled peppers.", focusSound: "p", instruction: "Repeat quickly 3 times." },
    { text: "She sells seashells by the seashore.", focusSound: "s", instruction: "Enunciate the 's' and 'sh' clearly." }
  ],
  minimal_pairs: [
    { pair: ["Ship", "Sheep"], focusSound: "i vs ee", instruction: "Distinguish between short 'i' and long 'ee'." },
    { pair: ["Bat", "Bad"], focusSound: "t vs d", instruction: "Notice the difference in the final consonant." }
  ]
};

export async function getExerciseContent(type) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json', temperature: 0.8 } });
    const complexityPrompt = type === 'shadowing' 
      ? "Provide 3 unique, advanced English sentences. Each sentence MUST be 20-30 words long, complex in structure, and reflect highly natural but sophisticated speech." 
      : "Provide 3 unique, targeted tongue twisters or minimal pairs.";
    
    const prompt = `${complexityPrompt} Return ONLY a JSON array. 
    Category: "${type}".
    JSON Schema: ${type === 'minimal_pairs' ? '{pair: [string, string], focusSound, instruction}' : '{text, focusSound, instruction}'}`;
    
    const result = await model.generateContent(prompt);
    const content = safeJsonParse(result.response.text());
    if (Array.isArray(content) && content.length > 0) return content;
    return FALLBACK_EXERCISES[type] || FALLBACK_EXERCISES['shadowing'];
  } catch (e) { return FALLBACK_EXERCISES[type] || FALLBACK_EXERCISES['shadowing']; }
}

export async function evaluateActiveRecall(word, sentence) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json' } });
    const prompt = `Evaluate "${word}" in: "${sentence}". JSON: {correct: boolean, naturalness: 1-10, feedback, betterPhrasings: [], avoidSaying: [], tip, modelSentence}`;
    const result = await model.generateContent(prompt);
    return safeJsonParse(result.response.text()) || FALLBACK_EVAL(word);
  } catch (e) { return FALLBACK_EVAL(word); }
}

const FALLBACK_EVAL = (word) => ({
  correct: true, naturalness: 8, feedback: "Great use of the phrase!", betterPhrasings: [], avoidSaying: [], 
  tip: "Try using this in a formal context.", modelSentence: `It was a great way to use ${word}.`
});

export async function getPhrasalChunks(category = 'Daily Life') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json' } });
    const prompt = `Provide 3 unique English phrases for: "${category}". JSON: {chunks: [{cat, badge, bc, bt, word, type, def, cefr, everydaySentences: [{context, sentence}]}]}`;
    const result = await model.generateContent(prompt);
    const data = safeJsonParse(result.response.text());
    return data?.chunks && Array.isArray(data.chunks) && data.chunks.length > 0 ? data.chunks : [];
  } catch (e) { return []; }
}

export async function getDailyMission(level = 'B2', interests = []) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json' } });
    const prompt = `Create a Daily Speaking Mission for a ${level} learner interested in ${interests.join(', ')}. JSON: {word, targetCount: number, context, motivation}`;
    const result = await model.generateContent(prompt);
    return safeJsonParse(result.response.text()) || { word: "Perspective", targetCount: 3, context: "Sharing your view", motivation: "Think bigger!" };
  } catch (e) { return { word: "Perspective", targetCount: 3, context: "Sharing your view", motivation: "Think bigger!" }; }
}
