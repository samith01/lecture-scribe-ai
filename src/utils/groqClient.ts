import Groq from 'groq-sdk';
import { TranscriptAnalysis } from './noteStructure';

export const initializeGroq = () => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  
  if (!apiKey) {
    console.warn('Groq API key not found. Please set VITE_GROQ_API_KEY in your environment.');
    return null;
  }

  return new Groq({
    apiKey,
    dangerouslyAllowBrowser: true
  });
};

export const groq = initializeGroq();

// Analyze transcript chunk and determine type + extract info
export const analyzeTranscriptChunk = async (
  transcript: string
): Promise<TranscriptAnalysis | null> => {
  if (!groq) {
    console.error('Groq client not initialized');
    return null;
  }

  try {
    const prompt = `Analyze this lecture transcript chunk and extract structured information.

Transcript:
"${transcript}"

Determine if this is:
1. OUTLINE: Professor is listing/introducing topics (e.g., "Today we'll cover X, Y, and Z" or "There are three types...")
2. DETAIL: Professor is explaining/elaborating on a specific topic
3. TRANSITION: Moving between topics without substantial content

Return ONLY valid JSON in this exact format:
{
  "type": "outline" | "detail" | "transition",
  "topics": ["Topic 1", "Topic 2"],
  "relatedTopic": "The main topic being discussed",
  "keyPoints": ["Key point 1", "Key point 2"],
  "confidence": 0.85
}

Rules:
- For OUTLINE type: fill "topics" array with the topics mentioned
- For DETAIL type: fill "relatedTopic" (what topic is this about) and "keyPoints" (important facts/concepts)
- For TRANSITION type: set confidence low
- confidence should be 0.0 to 1.0 based on how clear the content is
- Keep keyPoints concise and factual
- Extract actual information, not meta-commentary`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a lecture analysis expert. Extract structured information from transcripts. Always return valid JSON only, no other text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      return null;
    }

    const analysis = JSON.parse(responseText) as TranscriptAnalysis;
    
    // Validate response
    if (!analysis.type || !['outline', 'detail', 'transition'].includes(analysis.type)) {
      console.warn('Invalid analysis type:', analysis);
      return null;
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing transcript:', error);
    return null;
  }
};

// Optional: Batch processing for multiple chunks
export const analyzeMultipleChunks = async (
  chunks: string[]
): Promise<TranscriptAnalysis[]> => {
  const results = await Promise.all(
    chunks.map(chunk => analyzeTranscriptChunk(chunk))
  );
  
  return results.filter((r): r is TranscriptAnalysis => r !== null);
};
