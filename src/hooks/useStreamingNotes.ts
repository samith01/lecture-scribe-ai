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

const SYSTEM_PROMPT = `You are an expert lecture note-taker. Your job is to organize, condense, and update the FULL lecture notes document.

RULES:
- Work with the full transcript and current notes. Organize, group, and improve clarity.
- Only merge or replace headings when there are clear duplicates or the structure would be truly improved for study purposes.
- Never delete correct, unique headings—unless two sections cover the exact same topic, keep both as-is.
- Only remove a heading if it is a redundant duplicate or the underlying content has been clearly merged elsewhere.
- Never edit or remove key section headings simply for brevity or style.
- Use clear markdown structure: headings for each main topic, bullets for facts or examples, bold for technical terms.
- Always prefer completeness and clarity over over-condensation.
- Only output minimal incremental changes necessary to optimize the structure.

OUTPUT FORMAT (JSON only):
{
  "changes": [
    {
      "type": "add_heading",
      "heading": "",
      "sectionHeading": null
    },
    {
      "type": "add_bullet",
      "bullet": "",
      "sectionHeading": ""
    },
    {
      "type": "edit_line",
      "lineIndex": 5,
      "newText": "
                             "
    }
  ],
}

CHANGE TYPES:
- "add_heading": Create a new section heading
- "add_bullet": Add a bullet point under a section
- "edit_line": Modify existing text at lineIndex
- "delete_line": Remove a line at lineIndex

Think: What changes transform the current notes into a better-organized, condensed version?

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
  const minProcessInterval = 5000;
  const noteStructureRef = useRef<Map<string, string[]>>(new Map());
  const pendingTranscriptBatch = useRef<string>('');
  const sentenceCount = useRef<number>(0);

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

      const newContent = fullTranscript.slice(lastProcessedTranscript.current.length);

      if (newContent.trim().length > 0) {
        pendingTranscriptBatch.current += ' ' + newContent;
        const sentences = pendingTranscriptBatch.current.match(/[^.!?]+[.!?]+/g) || [];
        sentenceCount.current = sentences.length;
      }

      const isFirstProcessing = lastProcessedTranscript.current.length === 0;

      if (!isFirstProcessing && sentenceCount.current < 2 && fullTranscript.length < 100) {
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

      console.log('Processing full transcript:', fullTranscript.length, 'chars');
      console.log('Batched sentences:', sentenceCount.current);
      setIsProcessing(true);
      lastProcessTime.current = now;
      lastProcessedTranscript.current = fullTranscript;
      pendingTranscriptBatch.current = '';
      sentenceCount.current = 0;

      try {
        const currentContent = animatorRef.current.getCurrentContent();

        const userPrompt = currentContent.length > 0
          ? `FULL TRANSCRIPT SO FAR:\n"${fullTranscript}"\n\nCURRENT NOTES:\n${currentContent}\n\nTASK: Organize, condense, and update the full document. Look at the entire transcript and current notes. Generate incremental changes to improve structure, group related concepts, condense redundancy, and fix any issues. Think holistically about the best organization.`
          : `FULL TRANSCRIPT:\n"${fullTranscript}"\n\nTASK: Create initial well-organized lecture notes. Generate changes to build the structure.`;

        console.log('Sending to AI - Transcript length:', fullTranscript.length, 'Current notes length:', currentContent.length);

        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          model: 'llama-3.1-8b-instant',
          max_tokens: 1500,
          temperature: 0.1,
          response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content?.trim() || '';

        if (!responseText) {
          console.error('No response from AI');
          setIsProcessing(false);
          return;
        }

        console.log('AI Response received:', responseText.substring(0, 200) + '...');

        let result: { changes: TextChange[]; confidence: number };
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
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
    pendingTranscriptBatch.current = '';
    sentenceCount.current = 0;

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
