import { useState, useCallback, useRef } from "react";
import { groq } from "@/utils/groqClient";

// SYSTEM PROMPT: comprehensive, structured, no info dropped.
const SYSTEM_PROMPT = `You are an expert live note-taker for technical lectures.
Your job is to convert the transcript below into logically structured, beautiful, and COMPLETE notes.

RULES:
- Do NOT omit any important point, term, statistic, or example from the transcript.
- Use '##' for main sections (topic or concept names).
- Use '-' for main bullet points. Use '  -' (two spaces) for subpoints/examples.
- Use bold (**term**) for important technical words or definitions.
- REVISE: If new content relates to an earlier topic, edit that section (not just add to the end).
- Preserve logical order (Intro, key points, examples, conclusion).
- DO NOT repeat the same bullet unless a new angle is provided.
- Include context if a sentence is incomplete or fragmented.
- ONLY use information actually present in the transcript (no invention, no summaries beyond what was said).
- If a word or phrase in the transcript appears to be misheard, garbled, or nonsensical due to STT errors (for example, unusual words, abrupt topic switches, or words that do not fit the subject), use the rest of the transcript to infer and silently correct it to the most likely intended meaning.
- Prefer technical accuracy. Fix obvious errors (e.g., "phtosyntesis" → "photosynthesis", "JavaScipt" → "JavaScript").
- If a word is ambiguous but could be guessed from strong context (e.g. “return value of a component” and the transcript says “returned values of a compoment”), standardize to the correct, expected technical term.
- DO NOT invent information or "fix" unless you are confident from context. If uncertain, keep the original phrase and mark it with (?) or in parentheses.
- Do NOT add commentary about corrections, just output the final, clean notes as if you heard the correct statement in the first place.

`;

interface UseGroqProcessorProps {
  onNotesUpdate: (notes: string) => void;
  onError: (error: string) => void;
}

export const useGroqProcessor = ({ onNotesUpdate, onError }: UseGroqProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [queue, setQueue] = useState<string[]>([]);
  const lastProcessTime = useRef<number>(0);
  const processingInterval = 12000; // you can tune this to desired refresh speed

  // Persist full transcript/content in your parent component, pass in here
  const processTranscript = useCallback(async (
    fullTranscript: string // MUST be all transcript so far
  ) => {
    if (!groq) {
      onError("Groq API not configured. Please add your API key.");
      return;
    }

    // Throttle rapid requests for performance/cost
    const now = Date.now();
    if (now - lastProcessTime.current < processingInterval) {
      setQueue((prev) => [...prev, fullTranscript]);
      return;
    }

    setIsProcessing(true);
    lastProcessTime.current = now;

    try {
      const userPrompt = `LECTURE TRANSCRIPT:
${fullTranscript}

TASK: Using only the transcript above, write the full, beautiful notes so far, following all note-taking rules. Never drop factual or technical info. Don't write explanations about what you are doing—output ONLY the actual notes document in markdown.`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        model: "llama-3.1-8b-instant", // Or another Groq-supported model
        max_tokens: 2000,
        temperature: 0.11,
        top_p: 0.8,
      });

      const updatedNotes = completion.choices[0]?.message?.content?.trim() || "";

      // Additional check: don't show if it's almost empty (sometimes LLM outputs nonsense if input is too minimal)
      if (updatedNotes && updatedNotes.replace(/[^a-zA-Z0-9]+/g, "").length > 10) {
        onNotesUpdate(updatedNotes);
      }
    } catch (error: any) {
      onError(`AI processing error: ${error.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  }, [onNotesUpdate, onError]);

  // Optional: batch queue support
  const processQueue = useCallback(async (fullTranscript: string) => {
    if (queue.length === 0 || !groq) return;
    setQueue([]);
    await processTranscript(fullTranscript);
  }, [queue, processTranscript]);

  const resetProcessor = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    processTranscript,
    processQueue,
    resetProcessor,
    isProcessing,
    queueLength: queue.length,
  };
};
