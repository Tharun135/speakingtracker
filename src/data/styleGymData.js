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
        title: 'The Role of a Helmet',
        content: "The most important piece of gear / that you will ever buy / is your helmet. / It’s not just about spending money; / it’s about protecting / the only thing / that cannot be replaced / — your brain.",
        instruction: "Speak with a steady, deep voice. Pause for a full second after 'replaced'.",
        refAudio: 'motorcycle-gear-part-1-thisconnect-s03e12.mp3'
      },
      {
        title: 'Gear is an Investment',
        content: "Do not look at gear / as a cost. / Look at it / as an insurance policy / that you hope / you never / have to use.",
        instruction: "Statically emphasize the word 'NEVER'. Keep your tempo consistent.",
        refAudio: 'motorcycle-gear-part-1-thisconnect-s03e12.mp3'
      }
    ]
  }
];
