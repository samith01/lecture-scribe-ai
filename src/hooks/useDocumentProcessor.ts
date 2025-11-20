import { useState, useCallback, useRef } from 'react';
import { groq } from '@/utils/groqClient';
import {
  DocumentNode,
  DocumentState,
  NodeEdit,
  createNode,
  buildDocumentState,
  applyEdit,
  renderToMarkdown,
} from '@/utils/documentStructure';

interface UseDocumentProcessorProps {
  onError: (error: string) => void;
}

const SYSTEM_PROMPT = `You are an expert lecture note-taker creating structured, well-formatted notes in real-time.

MARKDOWN SYNTAX RULES:
- Headings: Use # for H1, ## for H2, ### for H3, etc. (always include space after #)
- Bold: Use **text** for important terms and concepts
- Italic: Use *text* for emphasis
- Inline code: Use \`code\` for technical terms, variables, functions
- Unordered lists: Use - for bullet points
- Nested lists: Indent with 2 spaces for sub-bullets

NOTE-TAKING GUIDELINES:
1. Create clear section headings (##) for main topics
2. Use sub-headings (###) for subtopics within sections
3. Write concise bullet points for key facts and concepts
4. Bold (**) technical terms, definitions, and important concepts
5. Use inline code (\`) for code snippets, function names, variables
6. Keep bullets focused and scannable
7. Group related concepts under appropriate headings
8. Never repeat information - check existing content first

DOCUMENT STRUCTURE:
- Each node has a unique "key" identifier
- Use keys to reference which nodes to edit/add/delete
- Always work with the full document structure

OUTPUT FORMAT (JSON only):
{
  "edits": [
    {
      "action": "add",
      "parentKey": "node_xxx",
      "node": {
        "type": "heading",
        "content": "Topic Name",
        "level": 2,
        "children": []
      }
    },
    {
      "action": "add",
      "parentKey": "node_xxx",
      "node": {
        "type": "bullet",
        "content": "Key point with **bold term** and \`code\`",
        "level": 1,
        "children": []
      }
    },
    {
      "action": "edit",
      "key": "node_yyy",
      "newContent": "Updated content with **formatting**"
    },
    {
      "action": "delete",
      "key": "node_zzz"
    }
  ]
}

EDIT ACTIONS:
- "add": Create new node (provide parentKey and complete node object with type, content, level, children)
- "edit": Modify existing node content (provide key and newContent)
- "delete": Remove node (provide key)

NODE TYPES:
- "heading": Main section (level 2: ##)
- "subheading": Sub-section (level 3: ###)
- "bullet": Top-level bullet point
- "subbullet": Nested bullet point (child of bullet)
- "text": Plain text paragraph

IMPORTANT:
- Generate edits incrementally - only add new information or fix errors
- Always check if content already exists before adding
- Use proper markdown formatting in content
- Keep document well-organized and scannable
- Respond with ONLY valid JSON, no extra text`;

export const useDocumentProcessor = ({ onError }: UseDocumentProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentState, setDocumentState] = useState<DocumentState>(() => {
    const root = createNode('heading', '', 0, []);
    root.key = 'root';
    return buildDocumentState(root);
  });

  const lastProcessedTranscript = useRef<string>('');
  const lastProcessTime = useRef<number>(0);
  const minProcessInterval = 2000;
  const pendingTranscript = useRef<string>('');
  const sentenceCount = useRef<number>(0);

  const processTranscript = useCallback(
    async (fullTranscript: string) => {
      if (!groq) {
        onError('Groq API not configured');
        return;
      }

      if (!fullTranscript || fullTranscript.trim().length < 20) {
        return;
      }

      const newContent = fullTranscript.slice(lastProcessedTranscript.current.length);
      if (newContent.trim().length > 0) {
        pendingTranscript.current += ' ' + newContent;
        const sentences = pendingTranscript.current.match(/[^.!?]+[.!?]+/g) || [];
        sentenceCount.current = sentences.length;
      }

      if (sentenceCount.current < 2 && lastProcessedTranscript.current.length > 0) {
        return;
      }

      const now = Date.now();
      if (now - lastProcessTime.current < minProcessInterval && lastProcessedTranscript.current.length > 0) {
        return;
      }

      console.log('Processing transcript:', fullTranscript.length, 'chars,', sentenceCount.current, 'sentences');

      setIsProcessing(true);
      lastProcessTime.current = now;
      lastProcessedTranscript.current = fullTranscript;
      pendingTranscript.current = '';
      sentenceCount.current = 0;

      try {
        const currentMarkdown = renderToMarkdown(documentState.root);
        const documentStructure = JSON.stringify({
          root: documentState.root,
          keys: Array.from(documentState.keyMap.keys()),
        }, null, 2);

        const userPrompt = currentMarkdown.length > 0
          ? `FULL TRANSCRIPT:\n"${fullTranscript}"\n\nCURRENT DOCUMENT STRUCTURE:\n${documentStructure}\n\nCURRENT NOTES (MARKDOWN):\n${currentMarkdown}\n\nTASK: Review the transcript and current notes. Generate edits to add new information, improve organization, or fix errors. Use proper markdown formatting. Only add content that isn't already present.`
          : `FULL TRANSCRIPT:\n"${fullTranscript}"\n\nTASK: Create initial structured notes from this transcript. Use proper headings, bullets, and markdown formatting. Be concise and organized.`;

        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          model: 'llama-3.1-8b-instant',
          max_tokens: 2000,
          temperature: 0.1,
          response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content?.trim() || '';

        if (!responseText) {
          console.error('No response from AI');
          setIsProcessing(false);
          return;
        }

        console.log('AI Response:', responseText.substring(0, 300) + '...');

        let result: { edits: NodeEdit[] };
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          setIsProcessing(false);
          return;
        }

        if (result.edits && result.edits.length > 0) {
          console.log('Applying', result.edits.length, 'edits');

          let newState = documentState;
          result.edits.forEach(edit => {
            newState = applyEdit(newState, edit);
          });

          setDocumentState(newState);
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
    [onError, documentState]
  );

  const resetProcessor = useCallback(() => {
    const root = createNode('heading', '', 0, []);
    root.key = 'root';
    setDocumentState(buildDocumentState(root));
    lastProcessedTranscript.current = '';
    lastProcessTime.current = 0;
    pendingTranscript.current = '';
    sentenceCount.current = 0;
  }, []);

  const getMarkdown = useCallback(() => {
    return renderToMarkdown(documentState.root);
  }, [documentState]);

  return {
    processTranscript,
    isProcessing,
    resetProcessor,
    getMarkdown,
    documentState,
  };
};
