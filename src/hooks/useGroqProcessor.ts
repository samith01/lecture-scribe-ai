import { useState, useCallback, useRef } from 'react';
import { groq } from '@/utils/groqClient';
import { applySmartDiff } from '@/utils/incrementalNoteBuilder';

const SYSTEM_PROMPT = `You are an expert lecture note-taker. Extract key information and structure it as clean markdown notes.

CRITICAL RULES:
1. OUTPUT ONLY PURE MARKDOWN NOTES - no explanations, no meta-commentary
2. NEVER write text like "Not specified in transcript" or "Example:" or any explanatory text
3. Use clear, complete heading names (e.g., "## Artificial Intelligence Overview")
4. Create bullet points with "- " for main points
5. Use sub-bullets with "  - " for supporting details
6. Bold important terms with **term**
7. ONLY include information directly from the transcript
8. If information relates to an existing topic, add bullets to that section
9. Keep technical terms exact as spoken

OUTPUT FORMAT:
## Topic Name
- **Key term**: Definition
  - Supporting detail
- Another point
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

      let userPrompt: string;

      if (hasExistingNotes) {
        userPrompt = `EXISTING NOTES:
${currentNotes}

NEW TRANSCRIPT:
${transcriptToProcess}

Extract information from the new transcript and output ONLY the sections being added or modified.
If the topic exists, output that section with new bullets added.
If it's a new topic, output the new section.
OUTPUT ONLY PURE MARKDOWN - no explanations or commentary.`;
      } else {
        userPrompt = `TRANSCRIPT:
${transcriptToProcess}

Create structured lecture notes from this transcript.
OUTPUT ONLY PURE MARKDOWN NOTES - no explanations, no meta-commentary.
Use ## headings, bullet points, and bold for key terms.`;
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
      });

      let newContent = completion.choices[0]?.message?.content?.trim() || '';

      if (!newContent || newContent.length < 5) {
        setIsProcessing(false);
        return;
      }

      newContent = newContent
        .split('\n')
        .filter(line => {
          const trimmed = line.trim();
          if (!trimmed) return true;
          if (trimmed.startsWith('#')) return true;
          if (trimmed.startsWith('-')) return true;
          if (trimmed.startsWith('*')) return true;
          if (/^[A-Z]/.test(trimmed) && trimmed.includes(':')) return false;
          if (trimmed.toLowerCase().includes('not specified')) return false;
          if (trimmed.toLowerCase().includes('example:')) return false;
          if (trimmed.toLowerCase().includes('not mentioned')) return false;
          return true;
        })
        .join('\n')
        .trim();

      const wordCountInput = transcriptToProcess.split(/\s+/).length;
      const wordCountOutput = newContent.split(/\s+/).length;

      if (wordCountOutput > wordCountInput * 3) {
        console.warn('Output too long - possible hallucination, skipping');
        setIsProcessing(false);
        return;
      }

      if (hasExistingNotes) {
        console.log('Merging with existing notes...');
        const mergedNotes = applySmartDiff(currentNotes, newContent);
        console.log('Merged notes length:', mergedNotes.length);
        onNotesUpdate(mergedNotes);
      } else {
        console.log('Creating initial notes...');
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
