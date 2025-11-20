import { useState, useCallback, useRef, useEffect } from 'react';
import { groq } from '@/utils/groqClient';
import { TextStreamAnimator, TextChange } from '@/utils/textStreamAnimator';

interface StreamState {
  content: string;
  cursorLine: number;
  isAnimating: boolean;
}

interface UseStreamingNotesProps {
  onError: (error: string) => void;
}

const SYSTEM_PROMPT = `You are an expert in structuring classroom lecture notes for students.

Analyze the transcript and produce INCREMENTAL changes to build up notes progressively.

CRITICAL RULES:
1. Output ONLY valid JSON with incremental changes
2. Each change should be a discrete action (add heading, add bullet, edit line)
3. NEVER regenerate entire notes - only output NEW changes since last update
4. Organize related content under appropriate headings
5. Use clear, study-ready language (never copy raw transcript)
6. Bold key terms with **term**

OUTPUT FORMAT (JSON only):
{
  "changes": [
    {
      "type": "add_heading",
      "heading": "Machine Learning",
      "sectionHeading": null
    },
    {
      "type": "add_bullet",
      "bullet": "A subset of **artificial intelligence** focused on learning from data.",
      "sectionHeading": "Machine Learning"
    }
  ],
  "confidence": 0.95
}

CHANGE TYPES:
- "add_heading": Create a new section heading
- "add_bullet": Add a bullet point under a section
- "edit_line": Modify existing text (provide lineIndex and newText)
- "delete_line": Remove a line (provide lineIndex)

Respond with ONLY valid JSON, no extra text.`;

export const useStreamingNotes = ({ onError }: UseStreamingNotesProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamState, setStreamState] = useState<StreamState>({
    content: '',
    cursorLine: -1,
    isAnimating: false,
  });

  const animatorRef = useRef<TextStreamAnimator | null>(null);
  const lastProcessedTranscript = useRef<string>('');
  const lastProcessTime = useRef<number>(0);
  const processingTimeout = useRef<NodeJS.Timeout | null>(null);
  const minProcessInterval = 8000;
  const noteStructureRef = useRef<Map<string, string[]>>(new Map());

  useEffect(() => {
    animatorRef.current = new TextStreamAnimator((state) => {
      setStreamState(state);
    });

    return () => {
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
      }
    };
  }, []);

  const processTranscript = useCallback(
    async (fullTranscript: string) => {
      if (!groq || !animatorRef.current) {
        onError('System not ready');
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
          processTranscript(fullTranscript);
        }, minProcessInterval - (now - lastProcessTime.current));

        return;
      }

      const transcriptToProcess = fullTranscript.slice(lastProcessedTranscript.current.length);

      if (transcriptToProcess.trim().length < 15) {
        return;
      }

      console.log('Processing new transcript chunk:', transcriptToProcess.length, 'chars');
      setIsProcessing(true);
      lastProcessTime.current = now;
      lastProcessedTranscript.current = fullTranscript;

      try {
        const existingHeadings = Array.from(noteStructureRef.current.keys());
        const currentContent = animatorRef.current.getCurrentContent();

        const userPrompt = existingHeadings.length > 0
          ? `EXISTING HEADINGS:\n${existingHeadings.map(h => `- ${h}`).join('\n')}\n\nNEW TRANSCRIPT:\n"${transcriptToProcess}"\n\nGenerate ONLY the NEW changes needed to add this content. Do not regenerate existing content.`
          : `TRANSCRIPT:\n"${transcriptToProcess}"\n\nGenerate initial structure with headings and bullets.`;

        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          model: 'llama-3.1-8b-instant',
          max_tokens: 1000,
          temperature: 0.1,
          response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content?.trim() || '';

        if (!responseText) {
          setIsProcessing(false);
          return;
        }

        console.log('AI Response:', responseText);

        let result: { changes: TextChange[]; confidence: number };
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          setIsProcessing(false);
          return;
        }

        if (result.confidence < 0.5) {
          console.warn('Low confidence, skipping');
          setIsProcessing(false);
          return;
        }

        if (result.changes && result.changes.length > 0) {
          result.changes.forEach(change => {
            if (change.type === 'add_heading' && change.heading) {
              const heading = change.heading.replace(/^#+\s*/, '');
              if (!noteStructureRef.current.has(heading)) {
                noteStructureRef.current.set(heading, []);
              }
            } else if (change.type === 'add_bullet' && change.bullet && change.sectionHeading) {
              const heading = change.sectionHeading.replace(/^#+\s*/, '');
              const bullets = noteStructureRef.current.get(heading) || [];
              bullets.push(change.bullet);
              noteStructureRef.current.set(heading, bullets);
            }
          });

          console.log('Queueing', result.changes.length, 'animation changes');
          animatorRef.current.queueChanges(result.changes);
        }
      } catch (error: any) {
        console.error('Processing error:', error);

        if (error?.status === 429) {
          onError('Rate limit reached. Please wait.');
        } else if (error?.status === 401) {
          onError('Invalid API key.');
        } else {
          onError(`AI error: ${error?.message || 'Unknown error'}`);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [onError]
  );

  const resetProcessor = useCallback(() => {
    lastProcessedTranscript.current = '';
    lastProcessTime.current = 0;
    noteStructureRef.current.clear();

    if (animatorRef.current) {
      animatorRef.current.clear();
    }

    if (processingTimeout.current) {
      clearTimeout(processingTimeout.current);
      processingTimeout.current = null;
    }
  }, []);

  return {
    processTranscript,
    isProcessing,
    resetProcessor,
    streamState,
  };
};
