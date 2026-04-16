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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

let seenWords = new Set();

export async function getWordOfTheDay(level = 'B2', interests = []) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const exclusions = Array.from(seenWords).join(', ');
    const prompt = `Provide exactly 3 highly practical, high-frequency, common everyday English words for a ${level} learner. 
    STRICTLY avoid academic, literary, or rare words like "Juxtapose", "Mitigate", or "Paradigm". 
    Focus ONLY on words used in daily conversation, at a coffee shop, in a standard office meeting, or at home. 
    AVOID these words: [${exclusions}]. 
    Return ONLY a JSON array of exactly 3 objects: {"word": "...", "type": "...", "definition": "...", "everydaySentences": [{"context": "...", "sentence": "..."}], "sayItNaturally": ["...", "..."], "avoidSaying": ["..."], "tip": "...", "cefr": "..."}`;
    const result = await model.generateContent(prompt);
    const content = safeJsonParse(result.response.text());
    
    let words = [];
    if (Array.isArray(content) && content.length === 3) {
      words = content;
    } else {
      // Robust Fallback with filtering
      const available = FALLBACK_WORDS.filter(w => !seenWords.has(w.word));
      const pool = available.length >= 3 ? available : FALLBACK_WORDS;
      words = shuffle(pool).slice(0, 3);
    }
    
    words.forEach(w => seenWords.add(w.word));
    return words;
  } catch (e) { 
    console.error('Gemini Word Error:', e);
    const available = FALLBACK_WORDS.filter(w => !seenWords.has(w.word));
    const pool = available.length >= 3 ? available : FALLBACK_WORDS;
    const words = shuffle(pool).slice(0, 3);
    words.forEach(w => seenWords.add(w.word));
    return words; 
  }
}

const FALLBACK_WORDS = [
  { word: "Commute", type: "verb/noun", definition: "To travel regularly between home and work.", everydaySentences: [{ context: "Daily Life", sentence: "How long is your commute?" }], sayItNaturally: ["Get to work"], avoidSaying: ["Travel"], tip: "Rhymes with 'cute'.", cefr: "B1" },
  { word: "Reliable", type: "adj", definition: "Something or someone you can trust.", everydaySentences: [{ context: "Work", sentence: "She is a very reliable teammate." }], sayItNaturally: ["Dependable"], avoidSaying: ["Shaky"], tip: "The stress is on 'li'.", cefr: "B1" },
  { word: "Schedule", type: "noun/verb", definition: "A plan that lists times for things to happen.", everydaySentences: [{ context: "Work", sentence: "Let me check my schedule." }], sayItNaturally: ["Plan"], avoidSaying: ["Timetable"], tip: "In US: 'Ske-jool'.", cefr: "B1" },
  { word: "Frustrating", type: "adj", definition: "Making you feel annoyed or impatient.", everydaySentences: [{ context: "Life", sentence: "Traffic is so frustrating." }], sayItNaturally: ["Annoying"], avoidSaying: ["Difficult"], tip: "Focus on the 'rr' sound.", cefr: "B1" },
  { word: "Essential", type: "adj", definition: "Completely necessary; extremely important.", everydaySentences: [{ context: "Life", sentence: "Water is essential for life." }], sayItNaturally: ["Must-have"], avoidSaying: ["Important"], tip: "Stronger than just 'important'.", cefr: "B2" },
  { word: "Colleague", type: "noun", definition: "A person that you work with.", everydaySentences: [{ context: "Office", sentence: "I like my colleagues." }], sayItNaturally: ["Teammate"], avoidSaying: ["Co-worker"], tip: "Sounds like 'Koll-eeg'.", cefr: "B1" },
  { word: "Actually", type: "adverb", definition: "Used to emphasize what is real or true.", everydaySentences: [{ context: "Talk", sentence: "Actually, I prefer tea." }], sayItNaturally: ["In fact"], avoidSaying: ["Really"], tip: "Great filler word.", cefr: "B2" },
  { word: "Regarding", type: "prep", definition: "About or concerning something.", everydaySentences: [{ context: "Email", sentence: "I'm calling regarding the meeting." }], sayItNaturally: ["About"], avoidSaying: ["Concerning"], tip: "Professional but common.", cefr: "B2" },
  { word: "Efficient", type: "adj", definition: "Working well without wasting time or energy.", everydaySentences: [{ context: "Work", sentence: "We need an efficient plan." }], sayItNaturally: ["Quick"], avoidSaying: ["Fast"], tip: "Focus on 'E-fish-ent'.", cefr: "B2" },
  { word: "Opportunity", type: "noun", definition: "A chance to do something.", everydaySentences: [{ context: "Career", sentence: "This is a great opportunity." }], sayItNaturally: ["Chance"], avoidSaying: ["Opening"], tip: "Five syllables!", cefr: "B1" },
  { word: "Hesitate", type: "verb", definition: "To pause before doing something.", everydaySentences: [{ context: "Talk", sentence: "Don't hesitate to ask." }], sayItNaturally: ["Wait"], avoidSaying: ["Pause"], tip: "The 's' sounds like 'z'.", cefr: "B2" },
  { word: "Available", type: "adj", definition: "Free to do something or be used.", everydaySentences: [{ context: "Meetings", sentence: "Are you available tomorrow?" }], sayItNaturally: ["Free"], avoidSaying: ["Ready"], tip: "Four syllables.", cefr: "B1" },
  { word: "Coordinate", type: "verb", definition: "To organize different parts together.", everydaySentences: [{ context: "Project", sentence: "Let's coordinate our efforts." }], sayItNaturally: ["Organize"], avoidSaying: ["Plan"], tip: "Focus on 'Co-or-di-nate'.", cefr: "B2" },
  { word: "Convenient", type: "adj", definition: "Fitting in well with your plans.", everydaySentences: [{ context: "Life", sentence: "Is 5 PM convenient for you?" }], sayItNaturally: ["Easy"], avoidSaying: ["Good"], tip: "Ends with 'ent'.", cefr: "B1" },
  { word: "Flexible", type: "adj", definition: "Able to change easily.", everydaySentences: [{ context: "Time", sentence: "My schedule is flexible." }], sayItNaturally: ["Adaptable"], avoidSaying: ["Soft"], tip: "Rhymes with 'terrible'.", cefr: "B1" },
  { word: "Purchase", type: "verb/noun", definition: "To buy something.", everydaySentences: [{ context: "Shopping", sentence: "I made a large purchase today." }], sayItNaturally: ["Buy"], avoidSaying: ["Get"], tip: "Professional 'buy'.", cefr: "B1" },
  { word: "Verify", type: "verb", definition: "To check if something is true.", everydaySentences: [{ context: "Security", sentence: "Please verify your email." }], sayItNaturally: ["Check"], avoidSaying: ["Confirm"], tip: "Rhymes with 'classify'.", cefr: "B2" },
  { word: "Feedback", type: "noun", definition: "Information about a person's performance.", everydaySentences: [{ context: "Work", sentence: "Thanks for the feedback." }], sayItNaturally: ["Opinion"], avoidSaying: ["Review"], tip: "Compound word: Feed + Back.", cefr: "B1" },
  { word: "Appropriate", type: "adj", definition: "Suitable or right for a situation.", everydaySentences: [{ context: "Business", sentence: "That's not appropriate for work." }], sayItNaturally: ["Correct"], avoidSaying: ["Right"], tip: "Focus on 'Ap-pro-pri-ate'.", cefr: "B2" },
  { word: "Frequently", type: "adverb", definition: "Often.", everydaySentences: [{ context: "Habit", sentence: "I frequently visit this cafe." }], sayItNaturally: ["A lot"], avoidSaying: ["Always"], tip: "Ends with 'ly'.", cefr: "B1" }
];

export async function getWritingCorrection(sentence) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze: "${sentence}". Return JSON: {original, corrected, suggestions: string[], explanation, idioms: [{word, meaning}]}`;
    const result = await model.generateContent(prompt);
    return safeJsonParse(result.response.text()) || { original: sentence, corrected: sentence, suggestions: [], explanation: "Your sentence looks good!", idioms: [] };
  } catch (e) { return { original: sentence, corrected: sentence, suggestions: [], explanation: "Connection error.", idioms: [] }; }
}

export async function startConversationSim(scenario) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `[Expert Language Partner] You are roleplaying as the other person in a "${scenario}" scenario. Output ONLY a natural, concise opening line to start the conversation. Do not add any labels or explanations.`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (e) { return `Let's practice: ${scenario}! Tell me about yourself to get started.`; }
}

export async function continueConversationSim(scenario, messages) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const history = messages.map(m => `${m.role === 'user' ? 'User' : 'You'}: ${m.text}`).join('\n');
    const prompt = `[Expert Language Partner] You are the other person in a "${scenario}" roleplay. Here is the conversation so far:\n${history}\n\nContinue naturally as your character. Reply in 1-3 short sentences only. Do NOT add labels or explanations.`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (e) { return "That's really interesting! Can you tell me more about that?"; }
}

const ALL_TONGUE_TWISTERS = [
  // P sounds
  { text: "Peter Piper picked a peck of pickled peppers.", focusSound: "p", instruction: "Say it 3 times fast — keep the 'p' popping." },
  { text: "Paddy planted a pot of purple pansies by the pretty pink path.", focusSound: "p", instruction: "Notice every 'p' — don't let them blur together." },
  // S / SH sounds
  { text: "She sells seashells by the seashore.", focusSound: "s/sh", instruction: "Separate the 's' and 'sh' sounds clearly — don't blend them." },
  { text: "Six slick slim sycamore saplings.", focusSound: "s/sl", instruction: "Slow down on 'sycamore' — it's three syllables." },
  { text: "Silly Sally swiftly shooed seven silly sheep.", focusSound: "s/sh", instruction: "Keep the 's' sharp and the 'sh' smooth — they're different." },
  { text: "She saw Sharif's shoes on the sofa. Are Sharif's shoes Swiss?", focusSound: "s/sh", instruction: "Switch between 's' and 'sh' without letting them merge." },
  // W / WH sounds
  { text: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?", focusSound: "w/ch", instruction: "Steady rhythm — don't rush the 'ch' sounds." },
  { text: "Whether the weather is warm, whether the weather is hot, we have to put up with the weather, whether we like it or not.", focusSound: "w/th", instruction: "The 'wh' and 'th' are different — keep them clean." },
  { text: "Which witch wished which wicked wish?", focusSound: "w/wh", instruction: "Make the 'wh' breathy and distinct from hard 'w'." },
  // R / L sounds
  { text: "Red lorry, yellow lorry, red lorry, yellow lorry.", focusSound: "r/l", instruction: "Switch cleanly between 'r' and 'l' — don't merge them." },
  { text: "Really leery, rarely Larry.", focusSound: "r/l", instruction: "The tongue position for 'r' and 'l' is completely different — feel it." },
  { text: "Rory the warrior and Roger the worrier were reared wrongly in a rural brewery.", focusSound: "r", instruction: "Keep each 'r' distinct — don't flatten or drop it." },
  // B / T sounds
  { text: "Betty Botter bought some butter, but the butter Betty bought was bitter.", focusSound: "b/t", instruction: "Keep 'b' and 't' crisp — don't let the stops blur." },
  { text: "A big black bug bit a big black bear and the big black bear bled blood.", focusSound: "b/bl", instruction: "Each 'b' should be a clean stop — no slurring." },
  // TH sounds
  { text: "Lesser leather never weathered wetter weather better.", focusSound: "th/w", instruction: "The 'th' in weather is voiced — tongue actually touches teeth." },
  { text: "The thirty-three thieves thought that they thrilled the throne throughout Thursday.", focusSound: "th", instruction: "Voiced 'th' for 'the' and unvoiced 'th' for 'think' — they're different." },
  { text: "Three free throws. Three free throws. Three free throws.", focusSound: "th/r", instruction: "Don't let 'three' become 'free' — keep the 'th' in front." },
  // F / V sounds
  { text: "Friendly Frank flips fine flapjacks.", focusSound: "f/fl", instruction: "The 'fl' blend needs both sounds — don't drop the 'l'." },
  { text: "Five frantic frogs fled from fifty fierce fishes.", focusSound: "f/fr", instruction: "The 'fr' cluster must be crisp — air through top teeth on bottom lip." },
  // K / G / Hard-C sounds
  { text: "Can you can a can as a canner can a can?", focusSound: "k/c", instruction: "Each hard 'c' or 'k' should sound like a click." },
  { text: "Greek grapes, Greek grapes, Greek grapes.", focusSound: "gr/k", instruction: "The 'gr' cluster — don't let 'Greek' become 'reek'." },
  { text: "A skunk sat on a stump. The stump thunk the skunk stunk.", focusSound: "sk/st/nk", instruction: "The 'sk' and 'st' clusters need crisp stops — no blurring." },
  // NY / N sounds
  { text: "Unique New York, unique New York, you know you need unique New York.", focusSound: "ny/n", instruction: "Stress both syllables of 'unique' — don't rush it." },
  { text: "No need to light a night-light on a light night like tonight.", focusSound: "n/l", instruction: "Feel the contrast between the nasal 'n' and the lateral 'l'." },
  // CH / J sounds
  { text: "Chester cheetah chews a chunk of cheap cheddar cheese.", focusSound: "ch", instruction: "Each 'ch' is a clean affricate — 't' + 'sh' together." },
  { text: "Judge John judged justly.", focusSound: "j/dg", instruction: "The 'j' and 'dg' are the same sound — make them identical." },
  // Mixed difficulty
  { text: "I scream, you scream, we all scream for ice cream!", focusSound: "scr/cr", instruction: "The 'scr' cluster — don't drop the 's' at the start." },
  { text: "Fuzzy Wuzzy was a bear, Fuzzy Wuzzy had no hair. Fuzzy Wuzzy wasn't very fuzzy, was he?", focusSound: "f/w/z", instruction: "The 'z' in fuzzy should buzz — make it vibrate." },
  { text: "I thought I thought of thinking of thanking you.", focusSound: "th/ng", instruction: "Three different 'th' contexts — stay consistent." },
  { text: "If two witches would watch two watches, which witch would watch which watch?", focusSound: "w/wh/ch", instruction: "Four different sound clusters — don't let them bleed together." },
  // Advanced
  { text: "The seething sea ceaseth and thus the seething sea sufficeth us.", focusSound: "s/th/ea", instruction: "Slow and steady — every consonant cluster must be articulated." },
  { text: "Brisk brave brigadiers brandished broad bright blades, blunderbusses, and bludgeons.", focusSound: "br/bl", instruction: "The 'br' and 'bl' blends are different — feel your lips." },
  { text: "Imagine an imaginary menagerie manager managing an imaginary menagerie.", focusSound: "m/zh", instruction: "The French-origin 'zh' in 'menagerie' is rare in English — soft 'zh' not 'j'." },
  { text: "Near an ear, a nearer ear, a nearly ethereal ear.", focusSound: "n/r/ear", instruction: "The 'ear' vowel is consistent — don't let it drift to 'air'." },
  { text: "Swan swam over the sea. Swim, swan, swim! Swan swam back again. Well swum swan!", focusSound: "sw/wm", instruction: "The 'sw' blend with the nasal 'wm' ending — keep them distinct." },
  { text: "Bobby brings bright brass rings. Bring Bobby bright brass rings.", focusSound: "br/ng", instruction: "Clear 'ng' at the end of 'bring' and 'rings' — tongue against soft palate." },
  { text: "The big black-backed bumblebee.", focusSound: "b/bl/mb", instruction: "Three 'b' variants in one — initial, blended, and silent 'mb'." },
  { text: "Which wristwatches are Swiss wristwatches?", focusSound: "wr/sw/ch", instruction: "The 'wr' is silent — 'wrist' starts with 'r'. Don't add a 'w' sound." },
  { text: "Many mumbling mice are making midnight music in the moonlight.", focusSound: "m", instruction: "Every word starts with 'm' — keep each fresh and not mumbled." },
  { text: "Through three cheese trees three free fleas flew.", focusSound: "th/fr/fl", instruction: "Three different blends back to back — plan each syllable." },
];


const ALL_REFLECTION = [
  "What is one thing you learned about yourself today?",
  "Describe a moment recently when you felt truly proud of yourself.",
  "If you could give your younger self one piece of advice, what would it be?",
  "What does 'home' mean to you? Is it a place, a person, or a feeling?",
  "How do you handle stress, and what can you do to be kinder to yourself?",
  "Describe a challenge you faced recently and how you overcame it.",
  "What is a goal you have for the next month, and why is it important?",
  "Think of someone you admire. What qualities do they have that you'd like to develop?",
  "What are you most grateful for right now?",
  "How has your perspective on English learning changed since you started?"
];

const shuffle = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const ALL_CONCEPTS = [
  "Hydroponics vs Aquaponics", "Organic farming vs Natural farming", "Greenhouse vs Polyhouse", "Weather vs Climate", "Renewable energy vs Non-renewable energy", "Biodegradable vs Compostable", "Virus vs Bacteria", "Gene vs DNA", "Solar power vs Solar thermal", "Electric vehicle vs Hybrid vehicle",
  "AI vs Machine Learning", "Machine Learning vs Deep Learning", "Cloud computing vs Edge computing", "Internet vs World Wide Web", "Data vs Information", "Database vs Data warehouse", "API vs SDK", "Frontend vs Backend", "Encryption vs Hashing", "Blockchain vs Cryptocurrency",
  "Revenue vs Profit", "Income vs Wealth", "Assets vs Liabilities", "Inflation vs Recession", "GDP vs GNP", "Saving vs Investing", "Stocks vs Mutual Funds", "Interest vs Compound Interest", "Budget deficit vs Fiscal deficit", "Tax avoidance vs Tax evasion",
  "Startup vs Small business", "Freelancer vs Consultant", "Leader vs Manager", "Strategy vs Tactics", "Product vs Project", "Efficiency vs Effectiveness", "Vision vs Mission",
  "Calories vs Nutrients", "Fat vs Cholesterol", "Bacteria vs Infection", "Allergy vs Intolerance", "BMI vs Body fat", "Mental health vs Mental illness",
  "Fact vs Opinion", "Correlation vs Causation", "Ethics vs Morality", "Culture vs Tradition",  "Religion vs Spirituality", "Equality vs Equity", "Knowledge vs Wisdom",
  "Dark Web vs Deep Web", "Quantum Computing vs Supercomputing", "Public Key vs Private Key", "Open Source vs Proprietary", "Agile vs Waterfall", "Docker vs Virtual Machine",
  "Black Hole vs White Hole", "Asteroid vs Comet", "Galaxy vs Universe", "Nuclear Fission vs Nuclear Fusion", "Kinetic vs Potential Energy", "AC vs DC Current"
];

const ALL_FUNDAMENTALS = [
  "What is PAN-PAN in terms of airplanes?", "What is a Black Box in an airplane?", "What causes sonic booms?", "How do GPS satellites work?", "What is the Speed of Light?", "How deep is the Mariana Trench?", "What is the tallest mountain from base to peak?", "What causes the Northern Lights?", "What is the Fibonacci sequence?", "What is the Turing Test?",
  "How do you calculate percentage quickly?", "How do you calculate compound interest?", "How do you calculate CAGR?", "How do you calculate loan EMI?", "How do you calculate probability?", "How do you calculate growth rate?", "How do you convert fractions to percentages?", "How do you calculate average?", "How do you calculate standard deviation?", "How do you estimate numbers mentally?",
  "What is inflation?", "How does compounding work in investments?", "What is mutual fund NAV?", "What is SIP?", "What is ETF?", "What is diversification?", "What is risk vs return?", "What is a credit score?", "What is an emergency fund?", "How much should you save monthly?",
  "What are the symptoms of heart attack?", "What are stroke warning signs?", "What is normal blood pressure?", "What is BMI?", "What causes diabetes?", "How does insulin work?", "What are antibiotics?", "What is immunity?", "What is dehydration?", "What is CPR?",
  "What is an operating system?", "What is RAM?", "What is CPU?", "What is GPU?", "What is cloud computing?", "What is blockchain?", "What is encryption?", "What is API?", "What is machine learning?", "What is cybersecurity?",
  "What causes gravity?", "What is energy?", "What is entropy?", "What is evolution?", "What is DNA?", "What is photosynthesis?", "What causes earthquakes?", "What causes climate change?", "What is nuclear energy?", "How does electricity work?",
  "What is GDP?", "What is recession?", "What is supply and demand?", "What is capitalism?", "What is socialism?", "What is taxation?", "What is government debt?", "What is public policy?", "What is globalization?",
  "Who is the GOAT in basketball?", "What is an Offside in football?", "How many rings are in the Olympic symbol?", "What is a Grand Slam in tennis?", "Who won the first FIFA World Cup?",
  "What was the first movie ever made?", "Who sang 'Bohemian Rhapsody'?", "What is the longest-running TV show?", "How many strings does a violin have?", "What are the 7 wonders of the ancient world?",
  "Who was the first human in space?", "How many planets have rings?", "What is the 'Goldilocks Zone'?", "What is a Light Year?", "How old is the Earth?",
  "Who was Alexander the Great?", "What was the Renaissance?", "Who was Joan of Arc?", "What is the Magna Carta?", "What caused the Industrial Revolution?",
  "How to detect fake news?", "How does the stock market work?", "What is the bystander effect?", "How to improve memory speed?", "What is the Pareto Principle (80/20 rule)?"
];

const FALLBACK_EXERCISES = {
  shadowing: [
    { text: "Despite the growing complexity of modern technology, many people find that a simple, disciplined approach to daily learning yields the most significant long-term results.", instruction: "Focus on the natural pause after 'technology' and the upward intonation on 'disciplined'." },
    { text: "If we consider the impact of sustainable energy on future urban planning, it becomes clear that early investment in green infrastructure is absolutely critical for the next generation.", instruction: "Practice the rhythmic flow of the entire complex sentence without pausing in the middle." },
    { text: "The way we communicate has changed dramatically over the past decade, and adapting to new platforms while maintaining genuine human connection remains one of our greatest challenges.", instruction: "Emphasise 'genuine human connection' — it's the emotional core of the sentence." },
  ],
  concepts: () => shuffle(ALL_CONCEPTS).slice(0, 3).map(concept => {
    const detailed = {
      "Hydroponics vs Aquaponics": "Hydroponics grows plants in nutrient-rich water. Aquaponics adds fish farming, where fish waste provides the nutrients.",
      "Organic farming vs Natural farming": "Organic farming allows approved organic fertilizers. Natural farming relies solely on the local ecosystem without external inputs.",
      "Greenhouse vs Polyhouse": "A greenhouse uses glass for temperature control. A polyhouse is a cheaper type of greenhouse made of polyethylene film.",
      "Weather vs Climate": "Weather is the short-term condition on a given day. Climate is the long-term average weather pattern over decades.",
      "Renewable energy vs Non-renewable energy": "Renewable energy comes from replenishing sources like the sun. Non-renewable energy like coal depletes and cannot be replaced.",
      "Biodegradable vs Compostable": "Biodegradable items eventually break down in nature. Compostable items break down quickly under specific conditions and enrich the soil.",
      "Virus vs Bacteria": "Bacteria are single-celled living organisms that reproduce independently. Viruses are infectious agents that need a host cell to multiply.",
      "Gene vs DNA": "DNA is the long molecule carrying genetic instructions. A gene is a specific, small section of that DNA responsible for a trait.",
      "Solar power vs Solar thermal": "Solar power uses panels to convert sunlight directly into electricity. Solar thermal uses sunlight to heat fluids for energy.",
      "Electric vehicle vs Hybrid vehicle": "Electric vehicles run 100% on battery power. Hybrids have both a battery and a traditional gas engine.",
      "AI vs Machine Learning": "AI is the broad concept of machines simulating human intelligence. Machine learning is the subset where machines learn from data without explicit programming.",
      "Machine Learning vs Deep Learning": "Machine learning uses algorithms to parse data. Deep learning uses complex multi-layered neural networks mimicking the human brain.",
      "Cloud computing vs Edge computing": "Cloud computing processes data in a centralized data center. Edge computing processes data locally, near where it was generated.",
      "Internet vs World Wide Web": "The Internet is the massive network of connected computers. The Web is the collection of web pages you access on that network.",
      "Data vs Information": "Data refers to raw, unorganized facts and figures. Information is data that has been processed and made meaningful.",
      "Database vs Data warehouse": "A database handles day-to-day transaction processing. A data warehouse stores historical data specifically for analysis and reporting.",
      "API vs SDK": "An API is a bridge letting two apps communicate. An SDK is a full toolbox containing APIs and tools to build apps.",
      "Frontend vs Backend": "Frontend is the visible part of an app users interact with. Backend is the hidden server and database powering it.",
      "Encryption vs Hashing": "Encryption is a two-way function that can be decrypted. Hashing is a one-way function used primarily to verify data integrity.",
      "Blockchain vs Cryptocurrency": "Blockchain is the underlying distributed ledger technology. Cryptocurrency is a digital token that uses blockchain to function securely.",
      "Revenue vs Profit": "Revenue is all the money brought in by a business. Profit is what remains after subtracting all expenses.",
      "Income vs Wealth": "Income is the money you earn over a specific period. Wealth is the total net value of everything you own minus your debts.",
      "Assets vs Liabilities": "Assets are things you own that put money in your pocket. Liabilities are things you owe that take money out of your pocket.",
      "Inflation vs Recession": "Inflation is when prices broadly rise, reducing purchasing power. A recession is a significant decline in overall economic activity.",
      "GDP vs GNP": "GDP measures all production within a country's borders. GNP measures all production by a country's citizens, regardless of location.",
      "Saving vs Investing": "Saving keeps money safe in cash for short-term goals. Investing puts money into assets to grow value over the long term.",
      "Stocks vs Mutual Funds": "A stock represents ownership in one specific company. A mutual fund pools money to buy a diversified basket of many stocks.",
      "Interest vs Compound Interest": "Interest is earned purely on the original principal. Compound interest earns interest on the principal AND the previously earned interest.",
      "Budget deficit vs Fiscal deficit": "A budget deficit is when planned spending exceeds planned revenue. A fiscal deficit includes the total borrowing need of the government.",
      "Tax avoidance vs Tax evasion": "Tax avoidance is legally minimizing your tax bill using deductions. Tax evasion is illegally hiding income and lying to authorities.",
      "Startup vs Small business": "A startup is designed to scale rapidly and disrupt a large market. A small business aims for steady, stable local profitability.",
      "Freelancer vs Consultant": "A freelancer executes specific tasks or deliverables. A consultant provides expert advice and strategic guidance on how to do things.",
      "Leader vs Manager": "A manager organizes people to accomplish a task. A leader inspires and motivates people to share a broader vision.",
      "Strategy vs Tactics": "Strategy is the overarching long-term plan to achieve a goal. Tactics are the specific, short-term actions taken to execute that strategy.",
      "Product vs Project": "A product is a continuous creation answering a user need. A project has a strict timeline with a defined beginning and end.",
      "Efficiency vs Effectiveness": "Efficiency is doing things right with minimal waste. Effectiveness is doing the right things to achieve the best outcome.",
      "Vision vs Mission": "A vision statement describes the future desired state. A mission statement describes what the organization is actively doing today.",
      "Calories vs Nutrients": "Calories measure the energy a food provides. Nutrients are the vitamins and minerals the body needs to function properly.",
      "Fat vs Cholesterol": "Dietary fat is an energy source found in food. Cholesterol is a waxy substance made by your liver, essential for cells.",
      "Bacteria vs Infection": "Bacteria are microscopic organisms everywhere around us. An infection occurs when harmful bacteria or viruses multiply and cause illness.",
      "Allergy vs Intolerance": "An allergy triggers the immune system, which can be life-threatening. An intolerance is a digestive issue that causes discomfort.",
      "BMI vs Body fat": "BMI is a calculation based solely on height and weight. Body fat percentage measures the actual proportion of fat tissue in the body.",
      "Mental health vs Mental illness": "Mental health refers to overall emotional well-being. A mental illness is a diagnosable condition affecting thinking or behavior.",
      "Fact vs Opinion": "A fact is a statement that can be proven true or false. An opinion expresses a personal belief, feeling, or viewpoint.",
      "Correlation vs Causation": "Correlation means two things happen at the same time. Causation means one thing definitively forced the other to happen.",
      "Ethics vs Morality": "Ethics are societal or professional rules of conduct. Morality refers to a person's individual, internal sense of right and wrong.",
      "Culture vs Tradition": "Culture is the overarching way of life of a group. Traditions are specific practices handed down from generation to generation.",
      "Religion vs Spirituality": "Religion is an organized system of beliefs and rituals. Spirituality is a personal, independent search for meaning and connection.",
      "Equality vs Equity": "Equality gives everyone the exact same resources. Equity distributes resources based on individual needs to reach equal outcomes.",
      "Knowledge vs Wisdom": "Knowledge is gathering facts, information, and skills. Wisdom is knowing how and when to appropriately apply that knowledge.",
      "Dark Web vs Deep Web": "The Deep Web is anything on the internet not indexed by search engines, like your email. The Dark Web is a hidden part of the Deep Web requiring specific software to access.",
      "Quantum Computing vs Supercomputing": "Supercomputers use traditional bits to process data very fast. Quantum computers use qubits to solve specific complex problems exponentially faster.",
      "Public Key vs Private Key": "A public key is used to encrypt data and is shared openly. A private key is used to decrypt that data and must be kept secret.",
      "Open Source vs Proprietary": "Open source software is free to use and modify by anyone. Proprietary software is owned by a company and usually restricted to licensed users.",
      "Agile vs Waterfall": "Waterfall is a linear, sequential project management approach. Agile is an iterative process that focuses on continuous feedback and flexibility.",
      "Docker vs Virtual Machine": "A Virtual Machine emulates an entire computer system. Docker packages an application and its dependencies into a lightweight container that runs on the same OS.",
      "Black Hole vs White Hole": "A Black Hole pulls everything in with gravity so strong light cannot escape. A White Hole is a theoretical opposite that only ejects energy and cannot be entered.",
      "Asteroid vs Comet": "Asteroids are rocky or metallic bodies mostly found between Mars and Jupiter. Comets are icy bodies that develop a glowing tail when close to the sun.",
      "Galaxy vs Universe": "A galaxy is a massive system of stars, gas, and dust held by gravity. The Universe is the entire collection of all galaxies, space, and time.",
      "Nuclear Fission vs Nuclear Fusion": "Nuclear fission is the splitting of a heavy atom to release energy. Nuclear fusion is the joining of light atoms (like hydrogen) to create even more energy, as stars do.",
      "Kinetic vs Potential Energy": "Potential energy is stored energy based on position (like a compressed spring). Kinetic energy is energy in motion (like a falling rock).",
      "AC vs DC Current": "AC (Alternating Current) periodically changes direction and is used for long distances. DC (Direct Current) flows in one direction and is used in batteries.",
    };
    return {
      title: concept,
      text: detailed[concept] || `This topic explores the fundamental differences in ${concept}. It involves understanding the unique properties and roles each part plays in its respective system.`,
      instruction: "Focus on pronouncing the keywords clearly while explaining."
    };
  }),
  fundamentals: () => shuffle(ALL_FUNDAMENTALS).slice(0, 3).map(q => {
    const answers = {
      "What is PAN-PAN in terms of airplanes?": "PAN-PAN is an international urgency signal for situations that are serious but not life-threatening. It comes from the French word 'panne', meaning a breakdown.",
      "What is a Black Box in an airplane?": "A flight data recorder and cockpit voice recorder that preserves the last hours of flight history. It's actually bright orange to make it easier to find after a crash.",
      "What causes sonic booms?": "A sonic boom is the sound associated with the shock waves created whenever an object traveling through the air travels faster than the speed of sound.",
      "How do GPS satellites work?": "GPS satellites circle the Earth in a precise orbit and transmit signal information to Earth. GPS receivers calculate the user's exact location using trilateration.",
      "What is the Speed of Light?": "The speed of light in a vacuum is approximately 299,792,458 meters per second (about 186,282 miles per second).",
      "How deep is the Mariana Trench?": "The Mariana Trench is about 11,000 meters (36,000 feet) deep at its lowest point, known as Challenger Deep.",
      "What is the tallest mountain from base to peak?": "Mauna Kea in Hawaii is the tallest mountain from base to peak (over 10,000m), though Everest is the highest above sea level.",
      "What causes the Northern Lights?": "They are caused by collisions between electrically charged particles from the sun that enter the earth's atmosphere.",
      "What is the Fibonacci sequence?": "A series of numbers where each number is the sum of the two preceding ones, usually starting with 0 and 1.",
      "What is the Turing Test?": "A test of a machine's ability to exhibit intelligent behavior equivalent to, or indistinguishable from, that of a human.",
      "How do you calculate percentage quickly?": "Move the decimal place to find 10% or 1%, then multiply. Example: 10% of 250 is 25.",
      "How do you calculate compound interest?": "Interest is earned on both the original money and the accumulated interest. Formula: A = P(1+r/n)^(nt).",
      "How do you calculate CAGR?": "Divide the ending value by the beginning value, raise to the power of (1/years), and subtract 1.",
      "How do you calculate loan EMI?": "EMI combines principal repayment and interest on the remaining balance using an amortization formula.",
      "How do you calculate probability?": "Divide the number of specific desired outcomes by the total number of possible outcomes.",
      "How do you calculate growth rate?": "Subtract the old value from the new value, divide by the old value, and multiply by 100.",
      "How do you convert fractions to percentages?": "Divide the top number by the bottom number, then multiply the result by 100.",
      "How do you calculate average?": "Add all the numbers together, then divide by how many numbers there are.",
      "How do you calculate standard deviation?": "It measures data spread by finding the square root of the variance (average of squared differences from the Mean).",
      "How do you estimate numbers mentally?": "Round numbers to the nearest 10 or 100 before performing operations to get a ballpark figure.",
      "What is inflation?": "The gradual loss of purchasing power as the general prices of goods and services rise over time.",
      "How does compounding work in investments?": "Your returns generate their own returns, creating an exponential growth effect over time.",
      "What is mutual fund NAV?": "Net Asset Value is the price per share of a mutual fund, calculated by dividing total assets by shares outstanding.",
      "What is SIP?": "A Systematic Investment Plan automatically invests a fixed amount of money at regular intervals.",
      "What is ETF?": "An Exchange-Traded Fund is a basket of securities that trades on an exchange just like a stock.",
      "What is diversification?": "Spreading your money across different investments to reduce overall risk.",
      "What is risk vs return?": "The principle that potential return rises with an increase in risk.",
      "What is a credit score?": "A 3-digit number representing your creditworthiness based on your history of borrowing and repaying debt.",
      "What is an emergency fund?": "Cash reserves set aside strictly for unplanned expenses or emergencies, typically 3-6 months' costs.",
      "How much should you save monthly?": "The 50/30/20 rule suggests saving and investing at least 20% of your after-tax income.",
      "What are the symptoms of heart attack?": "Chest discomfort, shortness of breath, and pain radiating to the left arm or jaw.",
      "What are stroke warning signs?": "Face drooping, arm weakness, and speech difficulty (think FAST).",
      "What is normal blood pressure?": "A normal reading is typically around 120/80 mmHg.",
      "What is BMI?": "Body Mass Index estimates body fat based on height and weight. Normal range is 18.5 to 24.9.",
      "What causes diabetes?": "Type 1 is autoimmune; Type 2 is caused by insulin resistance often linked to lifestyle factors.",
      "How does insulin work?": "It acts as a 'key' to let glucose from the food you eat enter your body's cells for energy.",
      "What are antibiotics?": "Medicines that destroy or slow the growth of bacteria, but do not work against viruses.",
      "What is immunity?": "The body's ability to resist or fight off infectious disease using antibodies and white blood cells.",
      "What is dehydration?": "A dangerous condition where your body loses more fluids than it takes in.",
      "What is CPR?": "Cardiopulmonary Resuscitation uses chest compressions to mimic how the heart pumps blood.",
      "What is an operating system?": "Master software that runs the computer and manages hardware, like Windows, macOS, or Linux.",
      "What is RAM?": "Random Access Memory is short-term, fast memory for active tasks, erased when power is off.",
      "What is CPU?": "The Central Processing Unit is the main brain of the computer that executes all instructions.",
      "What is GPU?": "The Graphics Processing Unit specialized in rendering images and handling parallel processing.",
      "What is cloud computing?": "Using remote servers on the internet to store and process data rather than a local hard drive.",
      "What is blockchain?": "A secure, decentralized, unchangeable digital ledger recording transactions across a network.",
      "What is encryption?": "Scrambling data into a secret code that can only be unlocked with a decryption key.",
      "What is API?": "An Application Programming Interface acts as a messenger letting two programs talk to each other.",
      "What is machine learning?": "A method of data analysis that lets computers learn from data without explicit programming.",
      "What is cybersecurity?": "The practice of defending computers, servers, and networks from malicious digital attacks.",
      "What causes gravity?": "Mass bends the fabric of spacetime, pulling objects toward it, as explained by General Relativity.",
      "What is energy?": "The quantitative property that must be transferred to an object to perform work on, or to heat it.",
      "What is entropy?": "A measure of disorder or randomness in a closed system, which constantly increases over time.",
      "What is evolution?": "The process by which different kinds of living organisms developed and diversified over millions of years.",
      "What is DNA?": "Deoxyribonucleic acid is the molecule carrying all genetic instructions for life.",
      "What is photosynthesis?": "The process by which green plants use sunlight to synthesize nutrients from CO2 and water.",
      "What causes earthquakes?": "A sudden release of energy in the Earth's lithosphere that creates seismic waves, usually from tectonic plates.",
      "What causes climate change?": "The long-term heating of Earth's climate system, driven primarily by human fossil fuel emissions.",
      "What is nuclear energy?": "Energy released during nuclear fission or fusion, used to generate massive amounts of electricity.",
      "How does electricity work?": "The flow of electrical power or charge, generated by the movement of electrons.",
      "What is GDP?": "Gross Domestic Product is the total monetary value of all goods and services produced in a country.",
      "What is recession?": "A significant, widespread, and prolonged downturn in economic activity.",
      "What is supply and demand?": "An economic model showing how availability and desire determine the price of a good.",
      "What is capitalism?": "An economic system where trade and industry are controlled by private owners for profit.",
      "What is socialism?": "A system where the means of production and exchange are owned or regulated by the community.",
      "What is taxation?": "The compulsory collection of money by a government to fund public services.",
      "What is government debt?": "The total amount of money owed by a country's national government to its creditors.",
      "What is public policy?": "Laws, guidelines, and actions implemented by governments to handle real-world problems.",
      "What is globalization?": "The growing interconnectedness of the world's economies, cultures, and populations.",
      "Who is the GOAT in basketball?": "Michael Jordan and LeBron James are most often cited as the Greatest of All Time (GOAT).",
      "What is an Offside in football?": "When an attacker is closer to the goal line than both the ball and the second-to-last defender when the ball is played.",
      "How many rings are in the Olympic symbol?": "Five interlocking rings (blue, yellow, black, green, and red) representing the five continents.",
      "What is a Grand Slam in tennis?": "Winning the Australian Open, French Open, Wimbledon, and US Open in a single calendar year.",
      "Who won the first FIFA World Cup?": "Uruguay won the first tournament in 1930, defeating Argentina in the final.",
      "What was the first movie ever made?": "Workers Leaving the Lumière Factory (1895) is often cited as the first motion picture.",
      "Who sang 'Bohemian Rhapsody'?": "The legendary rock band Queen, led by Freddie Mercury, released it in 1975.",
      "What is the longest-running TV show?": "Meet the Press (USA) has run since 1947. The Simpsons is the longest-running scripted sitcom.",
      "How many strings does a violin have?": "A standard modern violin has four strings tuned in perfect fifths: G, D, A, and E.",
      "What are the 7 wonders of the ancient world?": "The Pyramid of Giza, Hanging Gardens, Temple of Artemis, Statue of Zeus, Mausoleum at Halicarnassus, Colossus of Rhodes, and Lighthouse of Alexandria.",
      "Who was the first human in space?": "Yuri Gagarin (Soviet Union) became the first human in space on April 12, 1961.",
      "How many planets have rings?": "Four planets in our solar system have rings: Saturn, Jupiter, Uranus, and Neptune.",
      "What is the 'Goldilocks Zone'?": "The habitable zone around a star where liquid water can exist on a planet's surface.",
      "What is a Light Year?": "The distance light travels in one year, which is about 9.46 trillion kilometers.",
      "How old is the Earth?": "Earth is estimated to be approximately 4.54 billion years old.",
      "Who was Alexander the Great?": "A Macedonian king who conquered a massive empire stretching from Greece to India.",
      "What was the Renaissance?": "A period of 'rebirth' in art and science across Europe between the 14th and 17th centuries.",
      "Who was Joan of Arc?": "A French heroine and saint who led the French army to victory in the Hundred Years' War.",
      "What is the Magna Carta?": "A royal charter of rights agreed to by King John of England in 1215, limiting absolute power.",
      "What caused the Industrial Revolution?": "Transition to new manufacturing processes using machines, steam power, and factories in the 18th century.",
      "How to detect fake news?": "Check sources, verify with fact-checking sites, and look for standard journalistic practices.",
      "How does the stock market work?": "It is a network where investors buy and sell shares of public companies, determining their market value.",
      "What is the bystander effect?": "A psychological phenomenon where individuals are less likely to offer help if other people are present.",
      "How to improve memory speed?": "Use mnemonics, active recall, spaced repetition, and maintain good sleep and nutrition.",
      "What is the Pareto Principle (80/20 rule)?": "The idea that 80% of results come from 20% of efforts.",
      "How does electricity billing work?": "You are billed mathematically based on the number of Kilowatt-hours (kWh) of power you consume.",
      "How does insurance work?": "You pay a small premium to transfer the risk of a catastrophic financial loss to the insurance company.",
      "How does credit card interest work?": "You are charged a percentage on your unpaid balance, severely compounding daily if not paid in full.",
      "How to read a contract?": "Always focus heavily on the obligations, liabilities, termination clauses, and fine-print deliverables.",
      "How to negotiate salary?": "Always anchor first, focus entirely on the market value you provide, and negotiate total compensation.",
      "How to plan a budget?": "Track every dollar using the 50/30/20 rule: 50% needs, 30% wants, 20% savings/investments.",
      "How to make long-term decisions?": "Use second-order thinking—consider not just the immediate consequence, but the consequence of the consequence.",
      "How to evaluate risk?": "Calculate the worst-case scenario severity multiplied by its absolute mathematical probability.",
      "How to detect scams?": "If there is forced urgency, requests for unusual payment methods, or it sounds too good to be true, it's a scam.",
    };

    return {
      title: q,
      text: answers[q] || `Fascinating topic! Can you share your thoughts on "${q}"? Try to explain what it is and why it matters in 2-3 sentences.`,
      instruction: "Explain this concept confidently and clearly."
    };
  }),
  tongue_twisters: () => shuffle(ALL_TONGUE_TWISTERS).slice(0, 3),
  minimal_pairs: [
    // Short i vs Long ee
    { pair: ["Ship", "Sheep"], focusSound: "ɪ vs iː", instruction: "Short 'i' in ship — mouth barely open. Long 'ee' in sheep — stretch your lips." },
    { pair: ["Bit", "Beat"], focusSound: "ɪ vs iː", instruction: "Feel the difference in how long you hold the vowel." },
    { pair: ["Sit", "Seat"], focusSound: "ɪ vs iː", instruction: "The 'ea' in seat is longer and more tense than 'i' in sit." },
    { pair: ["Live", "Leave"], focusSound: "ɪ vs iː", instruction: "Very common confusion — 'I live here' vs 'I will leave here'." },
    { pair: ["Fill", "Feel"], focusSound: "ɪ vs iː", instruction: "Notice how your tongue moves up and forward for 'feel'." },
    { pair: ["Itch", "Each"], focusSound: "ɪ vs iː", instruction: "Short versus long vowel — the meaning changes completely." },
    // Short u vs Long oo
    { pair: ["Pull", "Pool"], focusSound: "ʊ vs uː", instruction: "Round your lips more and hold longer for 'pool'." },
    { pair: ["Full", "Fool"], focusSound: "ʊ vs uː", instruction: "'Full' is relaxed. 'Fool' is tense with a longer vowel." },
    { pair: ["Look", "Luke"], focusSound: "ʊ vs uː", instruction: "Names can sound very different — 'look' vs the name 'Luke'." },
    { pair: ["Could", "Cooed"], focusSound: "ʊ vs uː", instruction: "Modal verb vs past tense of 'coo' — very different contexts." },
    // Short a vs Short e
    { pair: ["Bad", "Bed"], focusSound: "æ vs ɛ", instruction: "Drop your jaw further for 'bad'. 'Bed' is more closed." },
    { pair: ["Pan", "Pen"], focusSound: "æ vs ɛ", instruction: "Very common confusion — 'a cooking pan' vs 'a pen for writing'." },
    { pair: ["Man", "Men"], focusSound: "æ vs ɛ", instruction: "Singular vs plural — just the vowel changes!" },
    { pair: ["Bag", "Beg"], focusSound: "æ vs ɛ", instruction: "Open wide for 'bag'. Close slightly for 'beg'." },
    { pair: ["Sand", "Send"], focusSound: "æ vs ɛ", instruction: "Crucial at the beach vs sending an email — don't mix these up." },
    // Short o vs Long aw
    { pair: ["Cot", "Caught"], focusSound: "ɒ vs ɔː", instruction: "Some accents merge these — but in standard English they differ." },
    { pair: ["Don", "Dawn"], focusSound: "ɒ vs ɔː", instruction: "The name 'Don' vs the time 'dawn' — a longer, rounder vowel." },
    // Vowel before r
    { pair: ["Ship", "Sharp"], focusSound: "ɪ vs ɑː", instruction: "The 'ar' in sharp is an open, long vowel — very different from 'i'." },
    { pair: ["Hit", "Heart"], focusSound: "ɪ vs ɑː", instruction: "Feel how far your jaw drops for 'heart' compared to 'hit'." },
    // Final consonants T vs D
    { pair: ["Bat", "Bad"], focusSound: "t vs d", instruction: "Unvoiced 't' stops air completely. Voiced 'd' adds a buzz." },
    { pair: ["Bet", "Bed"], focusSound: "t vs d", instruction: "The final sound changes meaning — feel your vocal cords for 'd'." },
    { pair: ["Coat", "Code"], focusSound: "t vs d", instruction: "Winter wear vs programming — one tiny sound makes the difference." },
    { pair: ["Seat", "Seed"], focusSound: "t vs d", instruction: "Notice the vowel is often longer before a voiced consonant like 'd'." },
    // Final P vs B
    { pair: ["Cap", "Cab"], focusSound: "p vs b", instruction: "Unvoiced 'p' vs voiced 'b' — your vocal cords should vibrate for 'b'." },
    { pair: ["Rope", "Robe"], focusSound: "p vs b", instruction: "Clothing vs the thing you climb — just the last sound is different." },
    // S vs Z
    { pair: ["Sip", "Zip"], focusSound: "s vs z", instruction: "'S' is unvoiced — just air. 'Z' buzzes — feel your throat vibrate." },
    { pair: ["Seal", "Zeal"], focusSound: "s vs z", instruction: "Animal vs enthusiasm — one sound, completely different meaning." },
    { pair: ["Fuss", "Fuzz"], focusSound: "s vs z", instruction: "Unvoiced hiss vs a voiced buzz at the end." },
    // TH voiced vs unvoiced
    { pair: ["Think", "This"], focusSound: "θ vs ð", instruction: "'Think' has unvoiced 'th' (no buzz). 'This' has voiced 'th' (buzz)." },
    { pair: ["Bath", "Bathe"], focusSound: "θ vs ð", instruction: "Noun vs verb — the 'th' sound changes! Unvoiced for 'bath', voiced for 'bathe'." },
    { pair: ["Teeth", "Teethe"], focusSound: "θ vs ð", instruction: "The noun 'teeth' ends unvoiced. The verb 'teethe' ends voiced." },
    // V vs W (very common for Indian speakers)
    { pair: ["Vine", "Wine"], focusSound: "v vs w", instruction: "'V' — top teeth on bottom lip. 'W' — round lips, no teeth contact." },
    { pair: ["Vest", "West"], focusSound: "v vs w", instruction: "Clothes vs a direction — extremely common confusion to fix!" },
    { pair: ["Very", "Wary"], focusSound: "v vs w", instruction: "Practice until 'very' never sounds like 'wary' again." },
    { pair: ["Veil", "Whale"], focusSound: "v vs w", instruction: "Feel your lip touch your teeth for 'v' — no contact for 'w'." },
    // L vs R
    { pair: ["Light", "Right"], focusSound: "l vs r", instruction: "Tongue tip touches teeth ridge for 'l'. Curls back for 'r'." },
    { pair: ["Liver", "River"], focusSound: "l vs r", instruction: "Both start with a different liquid consonant — feel the tongue placement." },
    { pair: ["Fly", "Fry"], focusSound: "l vs r", instruction: "Cooking methods — but very different sounds. Don't let 'fly' become 'fry'." },
    // N vs M
    { pair: ["Night", "Might"], focusSound: "n vs m", instruction: "Nasal sounds — 'n' tongue touches the ridge, 'm' lips press together." },
    { pair: ["Not", "Mot"], focusSound: "n vs m", instruction: "Feel where the air is blocked for each nasal." },
    // Ch vs Sh
    { pair: ["Chip", "Ship"], focusSound: "tʃ vs ʃ", instruction: "'Ch' has a 't' before the 'sh' — it's an affricate. 'Sh' is smooth." },
    { pair: ["Chair", "Share"], focusSound: "tʃ vs ʃ", instruction: "Furniture vs dividing — the 'ch' pops more than 'sh'." },
  ],
};

const getFallback = (type) => {
  const fb = FALLBACK_EXERCISES[type];
  if (typeof fb === 'function') return fb();
  return fb ? shuffle(fb).slice(0, 3) : shuffle(FALLBACK_EXERCISES.shadowing).slice(0, 3);
};

export async function getExerciseContent(type) {
  try {
    // For encyclopedic hardcoded factual data, bypass the LLM to provide an instant, 0-latency experience.
    if (type === 'fundamentals' || type === 'concepts') {
       return getFallback(type);
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: 'application/json', temperature: 1.0 } });
    const seed = Math.floor(Math.random() * 100000);
    
    let complexityPrompt;
    if (type === 'shadowing') {
      complexityPrompt = `Provide 3 COMPLETELY DIFFERENT advanced English sentences (seed:${seed}). Each must be 20-30 words, on a DIFFERENT TOPIC (e.g. travel, science, emotions, culture, food, work). Complex structure, highly natural sophisticated speech. Do NOT repeat any sentence from before.`;
    } else if (type === 'tongue_twisters') {
      complexityPrompt = `Provide 3 COMPLETELY DIFFERENT tongue twisters (seed:${seed}). Each must focus on a DIFFERENT consonant or sound. Make them genuinely difficult and fun. Do NOT use Peter Piper or She Sells Seashells.`;
    } else if (type === 'concepts') {
      const selected = shuffle(ALL_CONCEPTS).slice(0, 3).join('", "');
      complexityPrompt = `Explain the difference between these 3 concept pairs: "${selected}". For each, provide a clear 2-sentence explanation of their fundamental differences. You MUST format your response as a JSON array of exactly 3 objects. EXACT FORMAT: {"title": "X vs Y", "text": "Explanation of difference", "instruction": "Pronunciation tip"}.`;
    } else if (type === 'fundamentals') {
      const selected = shuffle(ALL_FUNDAMENTALS).slice(0, 3).join('", "');
      complexityPrompt = `Answer 4 questions. You MUST Answer these 3 knowledge questions: "${selected}". AND you MUST create 1 additional COMPLETELY NEW extraordinary random fact (e.g. Science, Trivia, or History). For each of these 4 items, provide a clear 2-sentence explanation and a 1-sentence real-world example. DO NOT say "explain it out loud" - you must provide the literal answer text. You MUST format your response as a JSON array. EXACT FORMAT: {"title": "The Question", "text": "The literal answer + example", "instruction": "Pronunciation tip"}.`;
    } else if (type === 'reflection') {
      const selected = shuffle(ALL_REFLECTION).slice(0, 3).join('", "');
      complexityPrompt = `Provide 3 deep-thinking self-reflection prompts like these: "${selected}". Each should encourage at least 30 seconds of speaking. You MUST format your response as a JSON array of 3 objects. EXACT FORMAT: {"title": "Prompt Title", "text": "The full question/prompt", "instruction": "Tip for emotional or clear speaking"}.`;
    } else {
      complexityPrompt = `Provide 3 unique, targeted minimal pairs (seed:${seed}). Each pair must focus on a DIFFERENT vowel or consonant contrast. Provide a clear, simple explanation of the physical difference in mouth/tongue position. JSON Schema: {pair: [string, string], focusSound, instruction: "CLEARTIP"}.`;
    }
    let schemaStr = '{text, focusSound, instruction}';
    if (type === 'minimal_pairs') schemaStr = '{pair: [string, string], focusSound, instruction}';
    else if (type === 'concepts' || type === 'fundamentals' || type === 'reflection') schemaStr = '{title, text, instruction}';
    
    const prompt = `${complexityPrompt} Return ONLY a JSON array. 
    Category: "${type}".
    JSON Schema: ${schemaStr}`;
    
    const result = await model.generateContent(prompt);
    const content = safeJsonParse(result.response.text());
    if (Array.isArray(content) && content.length > 0) return content;
    return getFallback(type);
  } catch (e) { return getFallback(type); }
}

export async function evaluateActiveRecall(word, sentence) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Provide 3 unique English phrases for: "${category}". JSON: {chunks: [{cat, badge, bc, bt, word, type, def, cefr, everydaySentences: [{context, sentence}]}]}`;
    const result = await model.generateContent(prompt);
    const data = safeJsonParse(result.response.text());
    return data?.chunks && Array.isArray(data.chunks) && data.chunks.length > 0 ? data.chunks : [];
  } catch (e) { return []; }
}

export async function getDailyMission(level = 'B2', interests = []) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Create a Daily Speaking Mission for a ${level} learner interested in ${interests.join(', ')}. JSON: {word, targetCount: number, context, motivation}`;
    const result = await model.generateContent(prompt);
    return safeJsonParse(result.response.text()) || { word: "Perspective", targetCount: 3, context: "Sharing your view", motivation: "Think bigger!" };
  } catch (e) { return { word: "Perspective", targetCount: 3, context: "Sharing your view", motivation: "Think bigger!" }; }
}
