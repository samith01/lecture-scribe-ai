import { useState, useCallback, useRef } from 'react';
import { groq } from '@/utils/groqClient';
import { applySmartDiff } from '@/utils/incrementalNoteBuilder';

const SYSTEM_PROMPT = `You are an expert lecture note-taker. Your job is to extract key information and structure it beautifully.

CRITICAL RULES:
1. ONLY process NEW information from the transcript that isn't already in the notes
2. Use clear, complete heading names (e.g., "## Artificial Intelligence Overview")
3. Create bullet points with "- " for main points
4. Use sub-bullets with "  - " for supporting details
5. Bold important terms with **term**
6. Group related information logically under appropriate headings
7. NEVER invent or add information not in the transcript
8. If information relates to an existing topic, add bullets to that section
9. Keep technical terms exact as spoken

OUTPUT FORMAT (example):
## Main Topic Name
- **Key term**: Definition or explanation
  - Supporting detail or example
- Another important point
- Related concept

## Different Topic
- Point about this topic`;

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

  const processTranscript = useCallback(async (
    recentTranscript: string,
    currentNotes: string,
    fullTranscript: string
  ) => {
    if (!groq) {
      onError('Groq API not configured. Please add VITE_GROQ_API_KEY to your .env file');
      return;
    }

    if (!recentTranscript || recentTranscript.trim().length < 20) {
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

    const transcriptToProcess = recentTranscript.slice(lastProcessedTranscript.current.length);

    if (transcriptToProcess.trim().length < 15) {
      return;
    }

    setIsProcessing(true);
    lastProcessTime.current = now;
    lastProcessedTranscript.current = recentTranscript;

    try {
      const hasExistingNotes = currentNotes && currentNotes.trim().length > 0;

      let userPrompt: string;

      if (hasExistingNotes) {
        userPrompt = `EXISTING NOTES:
${currentNotes}

NEW TRANSCRIPT SEGMENT:
${transcriptToProcess}

TASK: Extract new information from the transcript segment and add it to the appropriate sections.
- If the topic already exists in notes, add new bullet points to that section
- If it's a new topic, create a new section with ## heading
- Only output the NEW or MODIFIED sections, NOT the entire document
- Format each section with its heading and bullets

Example output if adding to existing topic:
## Existing Topic Name
- New bullet point from transcript
  - Supporting detail

Example output if creating new topic:
## New Topic Name
- First point about new topic
- Second point`;
      } else {
        userPrompt = `TRANSCRIPT:
${transcriptToProcess}

TASK: Create well-structured lecture notes from this transcript.
- Identify main topics and create clear ## headings
- Add bullet points for key information
- Use sub-bullets for details and examples
- Bold important terms with **term**

Output complete note sections with headings and bullets.`;
      }

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        model: 'llama-3.1-8b-instant',
        max_tokens: 800,
        temperature: 0.2,
        top_p: 0.95,
      });

      let newContent = completion.choices[0]?.message?.content?.trim() || '';

      if (!newContent || newContent.length < 5) {
        setIsProcessing(false);
        return;
      }

      const wordCountInput = transcriptToProcess.split(/\s+/).length;
      const wordCountOutput = newContent.split(/\s+/).length;

      if (wordCountOutput > wordCountInput * 3) {
        console.warn('Output too long - possible hallucination, skipping');
        setIsProcessing(false);
        return;
      }

      if (hasExistingNotes) {
        const mergedNotes = applySmartDiff(currentNotes, newContent);
        onNotesUpdate(mergedNotes);
      } else {
        onNotesUpdate(newContent);
      }

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
