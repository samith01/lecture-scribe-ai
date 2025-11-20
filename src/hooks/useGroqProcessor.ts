import { useState, useCallback, useRef } from 'react';
import { groq } from '@/utils/groqClient';

const SYSTEM_PROMPT = `You are an expert in structuring classroom lecture notes for students.

Your job is to analyze transcript chunks and produce structured, progressive lecture notes.

CRITICAL RULES:
1. If the transcript introduces MAIN TOPICS, return a list of section headings ONLY.
2. If the transcript explains a topic, identify the correct heading and provide study-ready bullet points.
3. NEVER copy sentences from the transcript - always summarize and rephrase for clarity.
4. Progressively fill in notes: Add bullets under existing headings, don't duplicate headings.
5. Use clear, descriptive headings relevant to students (e.g., "Supervised Learning", "Neural Networks").
6. Always format output as valid, structured JSON.

OUTPUT FORMAT (JSON only):
{
  "type": "outline" or "update",
  "createdHeadings": ["New Topic 1", "New Topic 2"],
  "updatedHeading": "Existing Topic Name",
  "bullets": [
    "Clear, concise bullet point.",
    "Another key point with **bold terms** for emphasis."
  ],
  "confidence": 0.95
}

RULES:
- "type": "outline" when only creating headings, "update" when adding details
- "createdHeadings": Only NEW sections added in this chunk
- "updatedHeading": The heading under which bullets should be inserted
- "bullets": Only new bullets, never repeat prior content
- "confidence": 0.0-1.0, set below 0.5 if uncertain
- Use clear wording, never raw transcript sentences
- Bold key terms with **term**

Respond with ONLY valid JSON, no extra text.`;

interface TranscriptAnalysis {
  type: 'outline' | 'update';
  createdHeadings?: string[];
  updatedHeading?: string;
  bullets?: string[];
  confidence: number;
  uncertaintyReason?: string;
}

interface UseGroqProcessorProps {
  onNotesUpdate: (notes: string) => void;
  onError: (error: string) => void;
}

export const useGroqProcessor = ({ onNotesUpdate, onError }: UseGroqProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const lastProcessedTranscript = useRef<string>('');
  const processingTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastProcessTime = useRef<number>(0);
  const minProcessInterval = 8000;
  const noteStructure = useRef<Map<string, string[]>>(new Map());

  const processTranscript = useCallback(async (
    recentTranscript: string,
    currentNotes: string,
    fullTranscript: string
  ) => {
    if (!groq) {
      onError('Groq API not configured. Please add VITE_GROQ_API_KEY to your .env file');
      return;
    }

    if (!fullTranscript || fullTranscript.trim().length < 20) {
      return;
    }

    const now = Date.now();
    if (now - lastProcessTime.current < minProcessInterval) {
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
      }

      processingTimeout.current = setTimeout(() => {
        processTranscript(recentTranscript, currentNotes, fullTranscript);
      }, minProcessInterval - (now - lastProcessTime.current));

      return;
    }

    const transcriptToProcess = fullTranscript.slice(lastProcessedTranscript.current.length);

    console.log('Processing check:', {
      lastProcessedLength: lastProcessedTranscript.current.length,
      currentLength: fullTranscript.length,
      newContentLength: transcriptToProcess.length,
      hasExistingNotes: currentNotes.length > 0
    });

    if (transcriptToProcess.trim().length < 15) {
      console.log('Skipping: new content too short');
      return;
    }

    console.log('Starting AI processing...');
    setIsProcessing(true);
    lastProcessTime.current = now;
    lastProcessedTranscript.current = fullTranscript;

    try {
      const hasExistingNotes = currentNotes && currentNotes.trim().length > 0;

      const existingHeadings = Array.from(noteStructure.current.keys());
      let userPrompt: string;

      if (hasExistingNotes) {
        userPrompt = `Given the following transcript chunk:

"${transcriptToProcess}"

EXISTING HEADINGS:
${existingHeadings.map(h => `- ${h}`).join('\n')}

TASK:
1. If the transcript introduces NEW main topics not in existing headings, list them in "createdHeadings".
2. If the transcript explains an existing topic, identify which heading and provide study-ready bullets under "updatedHeading".
3. Never copy sentences - always summarize and rephrase.
4. Place bullets under the correct heading for progressive fill-in.
5. Bold key terms with **term**.

Respond with ONLY valid JSON, no extra text.`;
      } else {
        userPrompt = `Given the following transcript chunk:

"${transcriptToProcess}"

TASK:
Analyze this lecture transcript and create initial structure.
1. If it introduces main topics, list them in "createdHeadings".
2. If it explains topics with details, provide bullets under "updatedHeading".
3. Never copy sentences - always summarize clearly.
4. Bold key terms with **term**.

Respond with ONLY valid JSON, no extra text.`;
      }

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        model: 'llama-3.1-8b-instant',
        max_tokens: 1000,
        temperature: 0.1,
        top_p: 0.9,
        response_format: { type: 'json_object' }
      });

      const responseText = completion.choices[0]?.message?.content?.trim() || '';

      if (!responseText) {
        setIsProcessing(false);
        return;
      }

      console.log('AI Response:', responseText);

      let analysis: TranscriptAnalysis;
      try {
        analysis = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        setIsProcessing(false);
        return;
      }

      if (analysis.confidence < 0.5) {
        console.warn('Low confidence analysis, skipping:', analysis.uncertaintyReason);
        setIsProcessing(false);
        return;
      }

      if (analysis.createdHeadings && analysis.createdHeadings.length > 0) {
        analysis.createdHeadings.forEach(heading => {
          if (!noteStructure.current.has(heading)) {
            console.log('Creating new heading:', heading);
            noteStructure.current.set(heading, []);
          }
        });
      }

      if (analysis.updatedHeading && analysis.bullets && analysis.bullets.length > 0) {
        const heading = analysis.updatedHeading;
        const existingBullets = noteStructure.current.get(heading) || [];

        const newBullets = analysis.bullets.filter(bullet => {
          const normalized = bullet.toLowerCase().trim();
          return !existingBullets.some(eb => eb.toLowerCase().trim() === normalized);
        });

        if (newBullets.length > 0) {
          console.log(`Adding ${newBullets.length} bullets to "${heading}"`);
          noteStructure.current.set(heading, [...existingBullets, ...newBullets]);
        }
      }

      const markdown = buildMarkdownFromStructure(noteStructure.current);
      console.log('Updated markdown length:', markdown.length);
      onNotesUpdate(markdown);

    } catch (error: any) {
      console.error('Groq processing error:', error);

      if (error?.status === 429) {
        onError('Rate limit reached. Please wait a moment before continuing.');
      } else if (error?.status === 401) {
        onError('Invalid API key. Please check your Groq API configuration.');
      } else {
        onError(`AI processing error: ${error?.message || 'Unknown error'}`);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [onNotesUpdate, onError]);

  const resetProcessor = useCallback(() => {
    lastProcessedTranscript.current = '';
    lastProcessTime.current = 0;
    noteStructure.current.clear();
    if (processingTimeout.current) {
      clearTimeout(processingTimeout.current);
      processingTimeout.current = null;
    }
  }, []);

  return {
    processTranscript,
    isProcessing,
    resetProcessor,
    queueLength: 0,
  };
};

function buildMarkdownFromStructure(structure: Map<string, string[]>): string {
  let markdown = '';

  structure.forEach((bullets, heading) => {
    markdown += `## ${heading}\n`;
    bullets.forEach(bullet => {
      markdown += `- ${bullet}\n`;
    });
    markdown += '\n';
  });

  return markdown.trim();
}
