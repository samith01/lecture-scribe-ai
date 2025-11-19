import { useState, useCallback, useRef } from 'react';
import { groq } from '@/utils/groqClient';

const SYSTEM_PROMPT = `You are a lecture note organizer. Compare new transcript segments to existing notes. Rules:
1. If content is new, add it under appropriate heading
2. If content elaborates existing point, merge it
3. If content is repetition, skip it
4. Organize with H2 headings (##) and bullet points
5. Generate 1 clarification question per major topic at the end
6. Return only markdown-formatted notes
7. Keep structure clean and academic`;

interface UseGroqProcessorProps {
  onNotesUpdate: (notes: string) => void;
  onError: (error: string) => void;
}

export const useGroqProcessor = ({ onNotesUpdate, onError }: UseGroqProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const lastProcessTime = useRef<number>(0);
  const processingInterval = 15000; // 15 seconds

  const processTranscript = useCallback(async (
    transcriptSegment: string,
    currentNotes: string,
    fullTranscript: string
  ) => {
    if (!groq) {
      onError('Groq API not configured. Please add your API key.');
      return;
    }

    // Rate limiting check
    const now = Date.now();
    if (now - lastProcessTime.current < processingInterval) {
      // Add to queue instead of processing immediately
      setQueue(prev => [...prev, transcriptSegment]);
      return;
    }

    setIsProcessing(true);
    lastProcessTime.current = now;

    try {
      // Get last 300 words of transcript for context
      const words = fullTranscript.split(' ');
      const contextWords = words.slice(-300).join(' ');

      const userPrompt = `Current notes:\n${currentNotes || '(No notes yet)'}\n\nNew transcript segment:\n${transcriptSegment}\n\nFull context (last 300 words):\n${contextWords}\n\nUpdate the notes with new information, avoiding repetition.`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        model: 'llama-3.1-70b-versatile',
        max_tokens: 2048,
        temperature: 0.3,
      });

      const updatedNotes = completion.choices[0]?.message?.content || currentNotes;
      onNotesUpdate(updatedNotes);
    } catch (error: any) {
      console.error('Groq processing error:', error);
      onError(`AI processing error: ${error.message || 'Unknown error'}`);
      // Queue for retry
      setQueue(prev => [...prev, transcriptSegment]);
    } finally {
      setIsProcessing(false);
    }
  }, [onNotesUpdate, onError]);

  const processQueue = useCallback(async (
    currentNotes: string,
    fullTranscript: string
  ) => {
    if (queue.length === 0 || !groq) return;

    const batchedSegment = queue.join(' ');
    setQueue([]);
    
    await processTranscript(batchedSegment, currentNotes, fullTranscript);
  }, [queue, processTranscript]);

  return {
    processTranscript,
    processQueue,
    isProcessing,
    queueLength: queue.length,
  };
};
