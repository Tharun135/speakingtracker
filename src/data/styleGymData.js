export const SPEAKER_STYLES = [
  {
    id: 'ENTREPRENEUR',
    name: 'The Tech Visionary',
    emoji: '🚀',
    description: 'Fast-paced, confident, and persuasive. Uses punchy sentences and vocal spikes for emphasis.',
    profile: {
      wpm: 155,
      pitchRange: 'wide',
      pausePattern: 'Strategic pauses after big ideas',
      vibe: 'Authoritative & Energetic'
    },
    scripts: [
      {
        title: 'Pitching the Future',
        content: "What if / I told you / that the device in your pocket / is more than just a tool? / It's a gateway / to a world / we haven't even imagined yet.",
        instruction: "Speak faster than usual. Stress the word 'imagined'.",
        refAudio: 'https://example.com/ref1.mp3' // Placeholder
      },
      {
        title: 'Disrupting the Status Quo',
        content: "We're not here / to build just another company. / We are here / to fundamentally / change how the world works.",
        instruction: "Use a sharp tone. No pauses between 'fundamentally' and 'change'.",
        refAudio: 'https://example.com/ref2.mp3'
      }
    ]
  },
  {
    id: 'STORYTELLER',
    name: 'The Podcaster',
    emoji: '🎙️',
    description: 'Rhythmic, warm, and engaging. Longer pauses and varied pitch to build suspense.',
    profile: {
      wpm: 130,
      pitchRange: 'dynamic',
      pausePattern: 'Natural, breathy pauses',
      vibe: 'Conversational & Engaging'
    },
    scripts: [
      {
        title: 'The Hidden Truth',
        content: "In a small town / where nothing ever happens... / something / began to stir. / It wasn't loud. / It was / a whisper.",
        instruction: "Wait 1 full second after 'happens'. Speak 'whisper' softly.",
        refAudio: 'https://example.com/ref3.mp3'
      }
    ]
  },
  {
    id: 'ANCHOR',
    name: 'The Pro News Anchor',
    emoji: '📺',
    description: 'Steady, clear, and perfectly articulated. Neutral but commanding tone.',
    profile: {
      wpm: 140,
      pitchRange: 'medium',
      pausePattern: 'Precise 0.5s pauses at every comma',
      vibe: 'Formal & Trustworthy'
    },
    scripts: [
      {
        title: 'Breaking Headlines',
        content: "Today's top stories / from across the globe: / Markets reach new highs, / while scientific breakthroughs / offer hope / for a cleaner future.",
        instruction: "Keep your pace identical for every sentence. Articulate every 't' and 'd'.",
        refAudio: 'https://example.com/ref4.mp3'
      }
    ]
  },
  {
    id: 'THISCONNECT',
    name: 'Shumi (ThisConnect)',
    emoji: '🏍️',
    description: 'Expert automotive journalist. Calm, authoritative, and extremely articulate. Focuses on technical precision and logical flow.',
    profile: {
      wpm: 142,
      pitchRange: 'medium',
      pausePattern: 'Deliberate, heavy pauses after technical points',
      vibe: 'Expert & Authoritative'
    },
    scripts: [
      {
        title: 'Buying High-End Gear',
        content: "Because if you buy expensive gear / then it will last forever. // Then the shopping trip / only happens like once every ten years / or something. / Unless you fall off, / of course. // I've been lucky right, / I started at basics / and all of that / and I've slowly climbed the ladder / because it's my primary spend / as far as clothes are concerned. / So I have very, very high-end gear now.",
        instruction: "Match the conversational yet authoritative tone. Use the double slashes for definitive pauses.",
        refAudio: 'motorcycle-gear-part-1-thisconnect-s03e12.mp3'
      },
      {
        title: 'Gear Doesn\'t Break',
        content: "There is no chance to shop. / It doesn't spoil, / it doesn't fray, / it doesn't break, / and I don't crash that much. / So... // You know the first time we were together, / we had gone for the Ducati Monster 795, / we were in Thailand.",
        instruction: "Keep the pacing rhythmic on 'doesn't spoil, doesn't fray, doesn't break'.",
        refAudio: 'motorcycle-gear-part-1-thisconnect-s03e12.mp3'
      },
      {
        title: 'The Maximum Budget Rule',
        content: "I remember asking him, / how do I decide a budget / on the jacket that I wanted to buy. // And he just looked me straight in the face, / 'as much as you can.' // That was his answer. / What's the max that you can stretch? / Go for that, / don't think twice.",
        instruction: "Slow down and add weight when quoting: 'As much as you can.'",
        refAudio: 'motorcycle-gear-part-1-thisconnect-s03e12.mp3'
      }
    ]
  },
  {
    id: 'AICOACH',
    name: 'The AI Coach',
    emoji: '🤖',
    description: 'Clear, logical, and measured. Explains complex technical ideas in calm, structured sentences. Great for articulation and deliberate pacing.',
    profile: {
      wpm: 132,
      pitchRange: 'medium',
      pausePattern: 'Pause after every key concept to let it land',
      vibe: 'Calm & Technical'
    },
    scripts: [
      {
        title: 'How the Visual Pacer Works',
        content: "When you click Start Pacer, / words light up one by one / in gold — / advancing at exactly / the speaker's words-per-minute. / At a breath mark, / the pacer freezes / and flashes red / for two-and-a-half times longer / than a normal word. / This forces you to breathe / exactly where the expert does.",
        instruction: "Speak each phrase as one smooth breath. Pause fully at every breath mark.",
      },
      {
        title: 'Why Notifications Failed on Android',
        content: "The app was trying to schedule alarms / using trigger types / that Android does not understand. / Words like 'weekly' and 'monthly' / are not valid. / Instead, / we must use calendar-based triggers / with a specific weekday / and a specific time. / That is what makes the alarm / reliable and precise.",
        instruction: "Emphasize 'not valid'. Speak with calm conviction — this is a diagnosis, not a lecture.",
      },
      {
        title: 'How Alarms Are Registered',
        content: "Every alarm on Android / must be registered / with the operating system directly. / It is not enough / to simply save your settings. / The app must call / a scheduling function / that hands the alarm / to Android's alarm manager. / Only then / will you be woken up / at the right time.",
        instruction: "Build the sentence slowly. Let 'alarm manager' land with weight.",
      },
      {
        title: 'The Exact Alarm Permission',
        content: "Android thirteen and fourteen / introduced a new requirement. / Apps that want to fire alarms / at a precise time / must ask for a special permission. / It is called / Schedule Exact Alarm. / Without it, / your notification / will either arrive late / or not arrive at all.",
        instruction: "Say 'Schedule Exact Alarm' like a proper noun — clear pronunciation, slight emphasis on each word.",
      },
      {
        title: 'Enabling Reminders Correctly',
        content: "To enable reminders, / open Settings / and tap the Enable button. / The app will request notification permissions. / If granted, / it will call the scheduling function / and register both alarms — / the weekly review / and the monthly review — / directly with Android. / If you see a confirmation popup, / the alarms are active.",
        instruction: "Pace this like a tutorial read-aloud. Steady, step-by-step delivery.",
      },
      {
        title: 'The Clock Touch Bug',
        content: "The numbers on the clock face / were getting in the way / of your touch. / When you tapped a number, / the clock got confused / about where your finger actually was. / The fix was simple: / make the numbers pass-through / so that no matter where you tap, / the calculation always uses / the exact center of the clock face.",
        instruction: "Slow down on 'pass-through'. Light, explanatory tone — like a teacher, not a robot.",
      },
      {
        title: 'The Time Change Problem',
        content: "There were two separate problems. / First, / the clock picker was broken — / touches were blocked by the number labels. / Second, / even when you changed the time, / the app forgot to re-register the alarm. / Saving new settings must always / reschedule the alarm immediately. / Otherwise, / the old time / remains active.",
        instruction: "Stress 'two separate problems'. Pause briefly before revealing the second one.",
      },
      {
        title: 'How the Voice Gender Setting Works',
        content: "When you select Feminine or Masculine, / the app saves that choice to storage. / The next time the AI speaks, / it scans every voice / installed on your device / and looks for names that match. / For masculine, / it searches for voices like David, / George, / or Daniel. / For feminine, / it looks for Samantha, / Karen, / or Victoria. / If no match is found, / it picks the first English voice available.",
        instruction: "Speed up slightly through the name lists — say them like quick examples, not a formal list.",
      },
      {
        title: 'Why a Web Browser Cannot Open a System Picker',
        content: "The system date-time picker / is a native phone component. / It exists on your Android device. / It exists on your iPhone. / But in a web browser, / there is no such component. / When you tap 'Change' in a browser, / the app tries to summon a phone widget / that simply does not exist. / Nothing happens. / The solution / is a custom in-app picker / that runs in every environment.",
        instruction: "Say 'nothing happens' with a slight pause — let the simplicity of it be funny.",
      },
      {
        title: 'Why 8 Tabs is Too Many',
        content: "Eight tabs is too many / because it makes the app feel cluttered / and hard to navigate. / Modern apps follow a rule: / show only four destinations / at any time. / Everything else / is one tap deeper. / This is how Instagram, / Spotify, / and YouTube / keep things simple / while hiding enormous depth.",
        instruction: "Stress 'four destinations'. List Instagram, Spotify, YouTube at a faster pace — like examples you know well.",
      },
      {
        title: 'The 4-Hub Navigation',
        content: "We redesigned the navigation / into four clean hubs. / Today / is your daily dashboard. / Gym / is your training center / for all practice modes. / Growth / is where your vocabulary / and journal live. / And Settings / handles your account / and preferences. / The bottom bar is clean. / The depth / is still there.",
        instruction: "Pause after naming each hub. '...The depth is still there.' — deliver this softly as a reassurance.",
      },
      {
        title: 'How the Style Gym Teaches You',
        content: "The Style Gym works / by giving you a professional speaking profile / to mirror. / Each profile has / a target words-per-minute, / a pitch range, / and a pause pattern. / The script contains / special breath marks / that show you exactly / where the expert pauses. / You shadow that pattern, / and the AI compares / your delivery / against the target fingerprint.",
        instruction: "Say 'fingerprint' slowly — it's the key metaphor. Build the sentence with increasing weight.",
      },
      {
        title: 'Shumi\'s Prosody Fingerprint',
        content: "Shumi speaks at one hundred and forty-two / words per minute. / That is his expert speed — / fast enough to sound knowledgeable, / but slow enough to be perfectly clear. / He stays in a calm, medium pitch range. / He never rises / like someone who is nervous. / He never falls flat / like someone who is bored. / That balance / is what you are training to replicate.",
        instruction: "Speak 'nervous' and 'bored' with slight vocal texture — don't just say them, show them briefly.",
      },
      {
        title: 'What the Breath Marks Do',
        content: "The forward slash marks / in the script / are not punctuation. / They represent / Shumi's actual breathing points. / Where he inhales. / Where he gives his words / room to settle. / If you read through the slashes / without pausing, / you sound rushed. / If you pause at every slash, / you sound like an expert. / That simple habit / is professional delivery.",
        instruction: "Speak 'where he inhales' quietly, almost like you are inhaling yourself. Genuine, not theatrical.",
      },
      {
        title: 'The Karaoke Shadowing Method',
        content: "Click Listen once / to hear the rhythm. / Do not focus on the words. / Focus on the music of the speech. / Where does it speed up? / Where does it breathe? / Then click Start Pacer / and follow the gold highlight. / Finally, / click Start Drill / and record yourself / speaking in that same rhythm. / The AI will tell you / exactly how close you are.",
        instruction: "Say 'the music of the speech' with warmth. That phrase is the heart of the method.",
      },
      {
        title: 'How the AI Feedback Works',
        content: "After your drill, / the AI listens to your recording. / It measures your words per minute. / It assesses your pause pattern. / It scores your pitch variation / out of ten. / Then it writes a coaching note / that compares your performance / directly against the target profile. / It will not say / 'good job.' / It will say, / 'You spoke at one-fifty-five. / Slow down at the breath marks / to sound more like Shumi.'",
        instruction: "Use a slightly different voice for the AI feedback quote at the end — matter-of-fact, precise.",
      },
      {
        title: 'The Credit Card Debt Audit',
        content: "Every week, / when you review your expenses, / the app checks your credit card purchases. / Any purchase / marked as unsettled / triggers a danger alert. / It shows you the exact amount / you owe from that week. / The idea is simple: / credit card spending / is not real spending / until that money leaves your bank. / Tracking the transfer / is how you stay debt-free.",
        instruction: "The phrase 'is not real spending' is the key insight. Say it slower, like a truth being revealed.",
      },
      {
        title: 'The Kakeibo Method',
        content: "Kakeibo is a Japanese budgeting method. / You set your income / at the start of the month. / You subtract your savings goal. / What remains / is your spendable budget. / Then, / you track every single rupee / by hand. / Not an app. / By hand. / The friction is the point.",
        instruction: "Pause for a full beat after 'By hand.' the second time — let it echo. Say 'The friction is the point' slowly.",
      }
    ]
  }
];
