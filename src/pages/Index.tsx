import { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { StatusBar } from '@/components/StatusBar';
import { TranscriptPanel } from '@/components/TranscriptPanel';
import { MindMapViewer } from '@/components/MindMapViewer';
import { MindMapExportMenu } from '@/components/MindMapExportMenu';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useMindMapProcessor } from '@/hooks/useMindMapProcessor';
import { useNoteStorage } from '@/hooks/useNoteStorage';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  const [transcript, setTranscript] = useState<string[]>([]);
  const [interimText, setInterimText] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const { createNewSession, updateSession, finalizeSession } = useNoteStorage();

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
    toast({
      title: 'Error',
      description: errorMsg,
      variant: 'destructive',
    });
  };

  const { processTranscript, isProcessing, resetProcessor, mindMapNodes } = useMindMapProcessor({
    onError: handleError,
  });

  const handleTranscript = (text: string) => {
    setTranscript(prev => {
      const newTranscript = [...prev, text];
      const fullTranscript = newTranscript.join(' ');

      console.log('New transcript received:', text);
      console.log('Full transcript length:', fullTranscript.length);

      processTranscript(fullTranscript);

      return newTranscript;
    });
    setInterimText('');
  };

  const handleInterimTranscript = (text: string) => {
    setInterimText(text);
  };

  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition({
    onTranscript: handleTranscript,
    onInterimTranscript: handleInterimTranscript,
    onError: handleError,
  });

  useEffect(() => {
    if (mindMapNodes.length > 0) {
      updateSession({ notes: JSON.stringify(mindMapNodes) });
    }
  }, [mindMapNodes, updateSession]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isListening) {
      interval = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          updateSession({ duration: newDuration });
          return newDuration;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening, updateSession]);

  // Update session with transcript
  useEffect(() => {
    if (transcript.length > 0) {
      updateSession({ transcript: transcript.join(' ') });
    }
  }, [transcript, updateSession]);

  const handleToggleRecording = () => {
    if (isListening) {
      console.log("Stopping listening")
      stopListening();
      setInterimText('');
      finalizeSession();
    } else {
      createNewSession();
      setTranscript([]);
      setInterimText('');
      setDuration(0);
      setError(null);
      resetProcessor();
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-background">
        <StatusBar
          isRecording={isListening}
          isProcessing={isProcessing}
          duration={duration}
          onToggleRecording={handleToggleRecording}
        />

        {error && (
          <div className="px-6 py-3 bg-destructive/10 border-b border-destructive/20">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden relative">
            <div className="w-2/5">
              <TranscriptPanel
                transcript={transcript}
                isRecording={isListening}
                interimText={interimText}
              />
            </div>
            <div className="flex-1 flex flex-col">
              <div className="p-6 border-b border-border bg-background">
                <h2 className="text-xl font-bold text-foreground">Visual Mind Map</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isProcessing ? 'AI is building your mind map...' : 'AI-powered visual note mapping'}
                </p>
              </div>
              <MindMapViewer
                mindMapNodes={mindMapNodes}
                isProcessing={isProcessing}
              />
            </div>

            {!isListening && (mindMapNodes.length > 0 || transcript.length > 0) && (
              <MindMapExportMenu
                mindMapNodes={mindMapNodes}
                transcript={transcript.join(' ')}
              />
            )}
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default Index;
