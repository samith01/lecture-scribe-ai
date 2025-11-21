import { useState, useCallback, useRef } from "react";
import { groq } from "@/utils/groqClient";

// SYSTEM PROMPT: comprehensive, structured, no info dropped.
const SYSTEM_PROMPT = `You are a computer science student attending a live lecture.

Your job:
- Take notes just like a top student would in real time, focusing on what would help for studying later.
- Capture only the key facts, techniques, definitions, process summaries, lists of best practices, and illustrative examples.
- Leave out general filler, unnecessary conversational fragments, and "here's what I think" statements.
- Use classic notes structure: clear sections (##), concise one-line bullets for each main idea, and sub-bullets for fine details.
- Err on the side of brevity and clarity—NOT transcript copying and NOT summarizing away technical specifics.
- If a point is important, restate it concisely (do not rephrase all transcript text).
- When multiple related points are made, combine/condense them into well-organized bullets.
- Use **bold** for terminology, and \`inline code\` for code-related items.
- Always output only the notes—the distillation a real student would create, not explanations of your actions or summaries that leave out technical content.
- Correct any grammatical or obvious speech-to-text errors by context, but ONLY if clearly wrong.
Do NOT repeat content already present in the notes, even if phrased differently. 
If the same idea appears twice in the transcript, only include it once in the notes—under the most appropriate heading.
Always check if a bullet, example, or definition is already noted before adding.
If a section or heading was already created (even if the transcript words it differently), do NOT create it again.
Combine and merge related information instead of making multiple similar entries.
Never list the same fact in more than one place, unless it’s truly part of multiple different concepts.

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
        temperature: 0.2,
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
