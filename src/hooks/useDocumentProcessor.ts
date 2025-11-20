import { useState, useCallback, useRef } from 'react';
import { groq } from '@/utils/groqClient';
import {
  DocumentNode,
  DocumentState,
  createNode,
  buildDocumentState,
  renderToMarkdown,
} from '@/utils/documentStructure';

interface UseDocumentProcessorProps {
  onError: (error: string) => void;
}

interface AIEdit {
  action: 'add_heading' | 'add_bullet' | 'add_subbullet';
  content?: string;
  level?: number;
}

const SYSTEM_PROMPT = `You are an expert lecture note-taker creating structured, well-formatted notes in real-time.

MARKDOWN FORMATTING RULES:
- Use ## for main topic headings (level 2)
- Use ### for sub-topics (level 3)
- Use **text** to bold important terms, definitions, and key concepts
- Use *text* for emphasis
- Use \`code\` for technical terms, variables, function names
- Keep bullet points concise and focused

NOTE-TAKING GUIDELINES:
1. Create clear section headings for main topics
2. Use sub-headings for subtopics within sections
3. Write focused bullet points for key facts
4. Bold technical terms and important concepts
5. Use inline code for technical items
6. Never repeat information
7. Group related concepts together

OUTPUT FORMAT (JSON only):
{
  "edits": [
    {
      "action": "add_heading",
      "content": "Topic Name",
      "level": 2
    },
    {
      "action": "add_bullet",
      "content": "Key point with **bold term** and \`code\`"
    },
    {
      "action": "add_subbullet",
      "content": "Sub-point or detail"
    }
  ]
}

EDIT ACTIONS:
- "add_heading": Create a new section heading (level 2 or 3)
- "add_bullet": Add a bullet point under the most recent heading
- "add_subbullet": Add a nested bullet under the most recent bullet

IMPORTANT:
- Only add NEW information from the transcript
- Check if content already exists before adding
- Use proper markdown formatting in content
- Be concise and organized
- Respond with ONLY valid JSON`;

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
  const currentHeadingKey = useRef<string | null>(null);
  const currentBulletKey = useRef<string | null>(null);

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

        const userPrompt = currentMarkdown.length > 0
          ? `FULL TRANSCRIPT:\n"${fullTranscript}"\n\nCURRENT NOTES:\n${currentMarkdown}\n\nTASK: Review the transcript and generate edits to add NEW information only. Use proper markdown formatting.`
          : `FULL TRANSCRIPT:\n"${fullTranscript}"\n\nTASK: Create initial structured notes. Use headings, bullets, and proper markdown formatting.`;

        console.log('Sending to AI...');

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

        console.log('AI Response received:', responseText.substring(0, 300));

        let result: { edits: AIEdit[] };
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError, responseText);
          setIsProcessing(false);
          return;
        }

        if (result.edits && result.edits.length > 0) {
          console.log('Applying', result.edits.length, 'edits');

          setDocumentState(prevState => {
            const newRoot = JSON.parse(JSON.stringify(prevState.root));

            result.edits.forEach(edit => {
              if (edit.action === 'add_heading' && edit.content) {
                const heading = createNode(
                  edit.level === 3 ? 'subheading' : 'heading',
                  edit.content,
                  edit.level || 2,
                  []
                );
                newRoot.children.push(heading);
                currentHeadingKey.current = heading.key;
                currentBulletKey.current = null;
                console.log('Added heading:', edit.content, 'key:', heading.key);
              } else if (edit.action === 'add_bullet' && edit.content) {
                let targetHeading = null;

                if (currentHeadingKey.current) {
                  const findHeading = (node: DocumentNode): DocumentNode | null => {
                    if (node.key === currentHeadingKey.current) return node;
                    for (const child of node.children) {
                      const found = findHeading(child);
                      if (found) return found;
                    }
                    return null;
                  };
                  targetHeading = findHeading(newRoot);
                }

                if (targetHeading) {
                  const bullet = createNode('bullet', edit.content, 1, []);
                  targetHeading.children.push(bullet);
                  currentBulletKey.current = bullet.key;
                  console.log('Added bullet to heading:', edit.content, 'key:', bullet.key);
                } else {
                  const heading = createNode('heading', 'Notes', 2, []);
                  const bullet = createNode('bullet', edit.content, 1, []);
                  heading.children.push(bullet);
                  newRoot.children.push(heading);
                  currentHeadingKey.current = heading.key;
                  currentBulletKey.current = bullet.key;
                  console.log('Added default heading and bullet:', edit.content);
                }
              } else if (edit.action === 'add_subbullet' && edit.content) {
                if (currentBulletKey.current) {
                  const findBullet = (node: DocumentNode): DocumentNode | null => {
                    if (node.key === currentBulletKey.current) return node;
                    for (const child of node.children) {
                      const found = findBullet(child);
                      if (found) return found;
                    }
                    return null;
                  };

                  const targetBullet = findBullet(newRoot);
                  if (targetBullet) {
                    const subbullet = createNode('subbullet', edit.content, 1, []);
                    targetBullet.children.push(subbullet);
                    console.log('Added subbullet:', edit.content);
                  }
                }
              }
            });

            const newState = buildDocumentState(newRoot);
            console.log('Document updated, total nodes:', newState.keyMap.size);
            return newState;
          });
        } else {
          console.log('No edits received from AI');
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
    currentHeadingKey.current = null;
    currentBulletKey.current = null;
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
