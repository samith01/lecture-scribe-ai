import { useState, useCallback } from 'react';
import { groq } from '@/utils/groqClient';

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  type: 'user' | 'system';
}

interface UseChatCorrectionsProps {
  currentNotes: string;
  onNotesUpdate: (notes: string) => void;
  onError: (error: string) => void;
}

export const useChatCorrections = ({
  currentNotes,
  onNotesUpdate,
  onError,
}: UseChatCorrectionsProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processCorrectionMessage = useCallback(
    async (userMessage: string) => {
      if (!groq) {
        onError('Groq API not configured');
        return;
      }

      if (!currentNotes || currentNotes.trim().length === 0) {
        onError('No notes to correct yet. Please start recording first.');
        return;
      }

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        content: userMessage,
        timestamp: new Date(),
        type: 'user',
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsProcessing(true);

      try {
        const systemPrompt = `You are an AI assistant helping to correct and improve lecture notes.

The user will provide corrections or guidance about the notes. Your job is to:
1. Apply the user's corrections to the existing notes
2. Fix any misheard words or incorrect terms
3. Reorganize sections if the user specifies the correct topic
4. Maintain the existing structure and formatting
5. Only modify what needs to be corrected

CRITICAL RULES:
- Output ONLY the corrected markdown notes
- Keep all existing content that wasn't mentioned in the correction
- Use ## for headings and - for bullets
- Bold important terms with **term**
- Do NOT add explanations or meta-commentary`;

        const userPrompt = `CURRENT NOTES:
${currentNotes}

USER CORRECTION:
${userMessage}

Apply the correction and output the updated notes in markdown format.`;

        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          model: 'llama-3.1-8b-instant',
          max_tokens: 2000,
          temperature: 0.1,
        });

        const correctedNotes = completion.choices[0]?.message?.content?.trim() || '';

        if (correctedNotes && correctedNotes.length > 10) {
          onNotesUpdate(correctedNotes);

          const systemMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: 'Notes updated based on your correction.',
            timestamp: new Date(),
            type: 'system',
          };

          setMessages((prev) => [...prev, systemMsg]);
        } else {
          onError('Unable to process correction. Please try again.');
        }
      } catch (error: any) {
        console.error('Correction processing error:', error);

        if (error?.status === 429) {
          onError('Rate limit reached. Please wait a moment.');
        } else if (error?.status === 401) {
          onError('Invalid API key.');
        } else {
          onError(`Error processing correction: ${error?.message || 'Unknown error'}`);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [currentNotes, onNotesUpdate, onError]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isProcessing,
    processCorrectionMessage,
    clearMessages,
  };
};
