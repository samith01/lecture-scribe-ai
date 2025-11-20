import { useState, useCallback, useRef } from 'react';
import { groq } from '@/utils/groqClient';

const SYSTEM_PROMPT = `You are a professional note-taker creating beautiful, well-structured lecture notes.

NOTE-TAKING GUIDELINES:
1. Create clear, descriptive headings (## Main Topic) from what the professor discusses
2. Group related points under appropriate headings
3. Use bullet points (-) for individual facts or concepts
4. Use sub-bullets (  -) for examples or details under main points
5. Keep headings complete and descriptive (e.g., "## Artificial Intelligence" not "## Intelligence")
6. Organize content logically - group related information together
7. Use bold (**text**) for key terms and definitions
8. Only include information from the transcript - no invented content
9. Remove filler words but keep technical terminology exact

STRUCTURE EXAMPLE:
## Main Topic Name
- Key concept or definition
  - Supporting detail or example
- Another key point
- Related point

## Another Topic
- Point about this topic`;

interface UseGroqProcessorProps {
  onNotesUpdate: (notes: string) => void;
  onError: (error: string) => void;
}

export const useGroqProcessor = ({ onNotesUpdate, onError }: UseGroqProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const lastProcessTime = useRef<number>(0);
  const processingInterval = 15000;
  const lastProcessedLength = useRef<number>(0);

  const processTranscript = useCallback(async (
    fullTranscript: string,
    currentNotes: string
  ) => {
    if (!groq) {
      onError('Groq API not configured. Please add your API key.');
      return;
    }

    // Only process if transcript has grown significantly
    const transcriptLength = fullTranscript.length;
    if (transcriptLength - lastProcessedLength.current < 50) {
      return;
    }

    const now = Date.now();
    if (now - lastProcessTime.current < processingInterval) {
      setQueue(prev => [...prev, fullTranscript]);
      return;
    }

    setIsProcessing(true);
    lastProcessTime.current = now;
    lastProcessedLength.current = transcriptLength;

    try {
      const userPrompt = `LECTURE TRANSCRIPT:
${fullTranscript}

${currentNotes ? `CURRENT NOTES:
${currentNotes}

TASK: Update and improve the notes structure. Add new information and reorganize if needed for better clarity. Make headings complete and descriptive.` 
: `TASK: Create well-structured notes from this transcript. Use clear, complete headings and organized bullet points.`}

REQUIREMENTS:
- Use complete topic names in headings (e.g., "Artificial Intelligence" not just "Intelligence")
- Group related information under appropriate headings
- Use bold (**text**) for important terms
- Create logical structure with main points and sub-points
- Only include what was actually said

Output the COMPLETE updated notes document.`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        model: 'llama-3.1-8b-instant',
        max_tokens: 2000,
        temperature: 0.1,
        top_p: 0.9,
      });

      let updatedNotes = completion.choices[0]?.message?.content?.trim() || '';
      
      // Basic hallucination check
      const wordCountInput = fullTranscript.split(/\s+/).length;
      const wordCountOutput = updatedNotes.split(/\s+/).length;
      
      if (wordCountOutput > wordCountInput * 2.5) {
        console.warn('Output too long - possible hallucination');
        return;
      }
      
      if (updatedNotes && updatedNotes.length > 10) {
        onNotesUpdate(updatedNotes);
      }
    } catch (error: any) {
      console.error('Groq processing error:', error);
      onError(`AI processing error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [onNotesUpdate, onError]);

  const processQueue = useCallback(async (fullTranscript: string, currentNotes: string) => {
    if (queue.length === 0 || !groq) return;

    setQueue([]);
    await processTranscript(fullTranscript, currentNotes);
  }, [queue, processTranscript]);

  const resetProcessor = useCallback(() => {
    setQueue([]);
    lastProcessedLength.current = 0;
  }, []);

  return {
    processTranscript,
    processQueue,
    resetProcessor,
    isProcessing,
    queueLength: queue.length,
  };
};
