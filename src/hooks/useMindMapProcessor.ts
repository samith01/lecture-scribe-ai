import { useState, useCallback, useRef } from 'react';
import { groq } from '@/utils/groqClient';
import { MindMapNode, createMindMapNode } from '@/utils/mindMapStructure';

interface UseMindMapProcessorProps {
  onError: (error: string) => void;
}

interface AIResponse {
  nodes: Array<{
    type: 'topic' | 'subtopic' | 'bullet';
    content: string;
    children?: AIResponse['nodes'];
  }>;
}

const SYSTEM_PROMPT = `You are an expert at creating structured, visual mind maps from lecture transcripts.

Your task is to organize lecture content into a hierarchical mind map structure with topics, subtopics, and key points.

OUTPUT FORMAT (JSON only):
{
  "nodes": [
    {
      "type": "topic",
      "content": "Main Topic Name",
      "children": [
        {
          "type": "bullet",
          "content": "Key point with **bold terms**"
        },
        {
          "type": "subtopic",
          "content": "Sub-topic Name",
          "children": [
            {
              "type": "bullet",
              "content": "Detail about subtopic"
            }
          ]
        }
      ]
    }
  ]
}

NODE TYPES:
- "topic": Main lecture topics/sections (use ## level headings)
- "subtopic": Sub-sections within topics (use ### level headings)
- "bullet": Individual facts, concepts, or points

CONTENT GUIDELINES:
1. Keep node content concise (5-15 words max)
2. Use **bold** for important terms and concepts
3. Use \`code\` for technical terms, functions, variables
4. Create clear topic hierarchy
5. Group related concepts together
6. Never repeat information
7. Extract only NEW information from transcript

STRUCTURE RULES:
- Topics can contain bullets or subtopics
- Subtopics can contain bullets
- Create multiple topics for different subjects
- Balance the tree (don't make it too deep or too wide)

IMPORTANT:
- Only add NEW content not already in the current mind map
- Respond with ONLY valid JSON
- Be concise and visual-friendly`;

export const useMindMapProcessor = ({ onError }: UseMindMapProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mindMapNodes, setMindMapNodes] = useState<MindMapNode[]>([]);

  const lastProcessedTranscript = useRef<string>('');
  const lastProcessTime = useRef<number>(0);
  const minProcessInterval = 2000;
  const pendingTranscript = useRef<string>('');
  const sentenceCount = useRef<number>(0);

  const convertAIResponseToNodes = useCallback(
    (aiNodes: AIResponse['nodes'], parentId: string | null = null, level: number = 0): MindMapNode[] => {
      return aiNodes.map((aiNode) => {
        const node = createMindMapNode(aiNode.type, aiNode.content, level, parentId);

        if (aiNode.children && aiNode.children.length > 0) {
          node.children = convertAIResponseToNodes(aiNode.children, node.id, level + 1);
        }

        return node;
      });
    },
    []
  );

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

      console.log('Processing transcript for mind map:', fullTranscript.length, 'chars');

      setIsProcessing(true);
      lastProcessTime.current = now;
      lastProcessedTranscript.current = fullTranscript;
      pendingTranscript.current = '';
      sentenceCount.current = 0;

      try {
        const currentMindMapSummary = mindMapNodes.length > 0
          ? JSON.stringify(
              mindMapNodes.map((node) => ({
                type: node.type,
                content: node.content,
                childCount: node.children.length,
              }))
            )
          : 'No existing nodes';

        const userPrompt =
          mindMapNodes.length > 0
            ? `FULL TRANSCRIPT:\n"${fullTranscript}"\n\nCURRENT MIND MAP NODES:\n${currentMindMapSummary}\n\nTASK: Add NEW topics, subtopics, and points from the transcript. Don't duplicate existing content.`
            : `FULL TRANSCRIPT:\n"${fullTranscript}"\n\nTASK: Create initial mind map structure with topics, subtopics, and key points.`;

        console.log('Sending to AI for mind map generation...');

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

        console.log('AI Response received:', responseText.substring(0, 200));

        let result: AIResponse;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError, responseText);
          setIsProcessing(false);
          return;
        }

        if (result.nodes && result.nodes.length > 0) {
          const newNodes = convertAIResponseToNodes(result.nodes);

          setMindMapNodes((prev) => {
            return [...prev, ...newNodes];
          });

          console.log('Added', newNodes.length, 'new mind map nodes');
        } else {
          console.log('No new nodes from AI');
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
    [onError, mindMapNodes, convertAIResponseToNodes]
  );

  const resetProcessor = useCallback(() => {
    setMindMapNodes([]);
    lastProcessedTranscript.current = '';
    lastProcessTime.current = 0;
    pendingTranscript.current = '';
    sentenceCount.current = 0;
  }, []);

  return {
    processTranscript,
    isProcessing,
    resetProcessor,
    mindMapNodes,
  };
};
