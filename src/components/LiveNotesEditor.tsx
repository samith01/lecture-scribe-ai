import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

interface LiveNotesEditorProps {
  content: string;
  operations: any[];
  isAnimating: boolean;
}

export const LiveNotesEditor = ({ content }: LiveNotesEditorProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);

  useEffect(() => {
    if (!isUserScrolling.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      isUserScrolling.current = scrollTop + clientHeight < scrollHeight - 50;
    }
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-8"
    >
      {!content && (
        <div className="text-center text-muted-foreground py-12">
          <p>Notes will appear here as you speak</p>
          <p className="text-sm mt-2">AI will automatically organize and structure your lecture content</p>
        </div>
      )}
      {content && (
        <div className="prose prose-slate max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold text-foreground mt-8 mb-6 first:mt-0">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-bold text-foreground mt-8 mb-4 first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">
                  {children}
                </h3>
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
                <strong className="font-bold text-blue-600">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-slate-700">{children}</em>
              ),
              code: ({ children }) => (
                <code className="bg-slate-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};
