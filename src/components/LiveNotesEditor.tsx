import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface EditOperation {
  type: 'insert' | 'delete' | 'replace';
  position: number;
  text?: string;
  deleteLength?: number;
  lineNumber?: number;
}

interface LiveNotesEditorProps {
  content: string;
  operations: EditOperation[];
  isAnimating: boolean;
}

export const LiveNotesEditor = ({ content, operations, isAnimating }: LiveNotesEditorProps) => {
  const [displayContent, setDisplayContent] = useState(content);
  const [cursorPosition, setCursorPosition] = useState<{ line: number; char: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);

  useEffect(() => {
    setDisplayContent(content);
  }, [content]);

  useEffect(() => {
    if (!isUserScrolling.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayContent]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      isUserScrolling.current = scrollTop + clientHeight < scrollHeight - 50;
    }
  };

  const renderContentWithCursor = () => {
    if (!isAnimating || !cursorPosition) {
      return (
        <div className="prose prose-slate max-w-none">
          <ReactMarkdown
            components={{
              h2: ({ children }) => (
                <h2 className="text-xl font-bold text-foreground mt-8 mb-4 first:mt-0">
                  {children}
                </h2>
              ),
              ul: ({ children }) => (
                <ul className="space-y-2 ml-4 my-4">{children}</ul>
              ),
              li: ({ children }) => (
                <li className="text-foreground leading-relaxed">{children}</li>
              ),
              p: ({ children }) => (
                <p className="text-foreground leading-relaxed mb-4">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-foreground">{children}</strong>
              ),
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>
      );
    }

    const lines = displayContent.split('\n');
    return (
      <div className="prose prose-slate max-w-none">
        {lines.map((line, lineIndex) => {
          const showCursor = cursorPosition.line === lineIndex;

          if (line.startsWith('## ')) {
            return (
              <h2 key={lineIndex} className="text-xl font-bold text-foreground mt-8 mb-4 first:mt-0 relative">
                {line.substring(3)}
                {showCursor && <span className="inline-block w-[2px] h-6 bg-blue-500 ml-1 animate-cursor-blink" />}
              </h2>
            );
          }

          if (line.startsWith('- ')) {
            const content = line.substring(2);
            const processedContent = content.split('**').map((part, i) =>
              i % 2 === 1 ? <strong key={i} className="font-bold text-foreground">{part}</strong> : part
            );

            return (
              <div key={lineIndex} className="flex items-start ml-4 my-2">
                <span className="text-foreground mr-2">•</span>
                <span className="text-foreground leading-relaxed relative">
                  {processedContent}
                  {showCursor && <span className="inline-block w-[2px] h-5 bg-blue-500 ml-1 animate-cursor-blink" />}
                </span>
              </div>
            );
          }

          if (line.trim() === '') {
            return <div key={lineIndex} className="h-2" />;
          }

          return (
            <p key={lineIndex} className="text-foreground leading-relaxed mb-4 relative">
              {line}
              {showCursor && <span className="inline-block w-[2px] h-5 bg-blue-500 ml-1 animate-cursor-blink" />}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-8"
    >
      {!displayContent && (
        <div className="text-center text-muted-foreground py-12">
          <p>Notes will appear here as you speak</p>
          <p className="text-sm mt-2">AI will automatically organize and structure your lecture content</p>
        </div>
      )}
      {displayContent && renderContentWithCursor()}
    </div>
  );
};
