const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const fs = require('fs');
const path = require('path');

const API_KEY = 'AIzaSyAGWXLjxdcIvIka5xyNn-FO-QNGMvUD5MM';
const genAI = new GoogleGenerativeAI(API_KEY);
const fileManager = new GoogleAIFileManager(API_KEY);

const MP3_PATH = path.join(__dirname, '..', 'motorcycle-gear-part-1-thisconnect-s03e12.mp3');

async function transcribe() {
  console.log('Uploading MP3 file using File API...');
  
  const uploadResponse = await fileManager.uploadFile(MP3_PATH, {
    mimeType: 'audio/mpeg',
    displayName: 'Shumi Podcast',
  });
  
  const fileUri = uploadResponse.file.uri;
  console.log('Upload complete. URI:', fileUri);

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  console.log('Sending to Gemini for transcription (this may take 1-2 minutes)...');
  
  const result = await model.generateContent([
    {
      fileData: {
        mimeType: uploadResponse.file.mimeType,
        fileUri: fileUri
      }
    },
    `You are a verbatim transcription engine. 
    Transcribe EXACTLY the FIRST 3 MINUTES of what the host says in this podcast episode, word for word.
    
    Instructions:
    - Transcribe every spoken word accurately for the first 3 minutes only (that's enough for practice).
    - Mark natural pauses and breath points with " / "
    - Mark longer pauses (after a key point) with " // "
    - Do NOT add punctuation or formatting beyond pause marks
    - Ignore music, sound effects, ads
    - Output ONLY the raw transcript text, nothing else
    `
  ]);

  const transcript = result.response.text();
  
  // Save full transcript
  const outPath = path.join(__dirname, 'shumi_transcript.txt');
  fs.writeFileSync(outPath, transcript, 'utf8');
  
  console.log('\n✅ Transcript saved to:', outPath);
  console.log('\n--- FIRST 2000 CHARACTERS ---');
  console.log(transcript.substring(0, 2000));
}

transcribe().catch(console.error);
