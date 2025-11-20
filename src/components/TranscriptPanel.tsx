import { useEffect, useRef } from 'react';

interface TranscriptPanelProps {
  transcript: string[];
  isRecording: boolean;
  interimText?: string;
}

export const TranscriptPanel = ({ transcript, isRecording, interimText }: TranscriptPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);

  useEffect(() => {
    if (!isUserScrolling.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimText]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      isUserScrolling.current = scrollTop + clientHeight < scrollHeight - 50;
    }
  };

  return (
    <div className="flex-1 flex flex-col border-r border-border bg-background">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">Live Transcript</h2>
        <p className="text-sm text-muted-foreground mt-1">Real-time speech transcription</p>
      </div>
      
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-3"
      >
        {transcript.length === 0 && !isRecording && (
          <div className="text-center text-muted-foreground py-12">
            <p>Click the record button to start transcribing your lecture</p>
          </div>
        )}
        
        {transcript.length === 0 && isRecording && (
          <div className="text-center text-muted-foreground py-12">
            <p>Listening... Start speaking</p>
          </div>
        )}

        {transcript.map((line, index) => (
          <div
            key={index}
            className="font-mono text-sm text-muted-foreground animate-fade-in-text"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            {line}
          </div>
        ))}

        {interimText && (
          <div className="font-mono text-sm text-muted-foreground/60 italic">
            {interimText}
          </div>
        )}
      </div>
    </div>
  );
};
