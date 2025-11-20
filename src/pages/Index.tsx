import { useState, useEffect } from 'react';
import { StatusBar } from '@/components/StatusBar';
import { TranscriptPanel } from '@/components/TranscriptPanel';
import { NotesPanel } from '@/components/NotesPanel';
import { ExportMenu } from '@/components/ExportMenu';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useGroqProcessor } from '@/hooks/useGroqProcessor';
import { useNoteStorage } from '@/hooks/useNoteStorage';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  const [transcript, setTranscript] = useState<string[]>([]);
  const [interimText, setInterimText] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const { createNewSession, updateSession, finalizeSession } = useNoteStorage();

  const handleTranscript = (text: string) => {
    setTranscript(prev => [...prev, text]);
    setInterimText('');

    // Trigger AI processing with last 3 sentences
    const recentTranscript = [...transcript, text].slice(-3).join(' ');
    const fullTranscript = [...transcript, text].join(' ');

    processTranscript(recentTranscript, notes, fullTranscript);
  };

  const handleInterimTranscript = (text: string) => {
    setInterimText(text);
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
    toast({
      title: 'Error',
      description: errorMsg,
      variant: 'destructive',
    });
  };

  const { isListening, isSupported, startListening, stopListening } = useSpeechRecognition({
    onTranscript: handleTranscript,
    onInterimTranscript: handleInterimTranscript,
    onError: handleError,
  });

  const { processTranscript, isProcessing, queueLength, resetProcessor } = useGroqProcessor({
    onNotesUpdate: (updatedNotes) => {
      setNotes(updatedNotes);
      updateSession({ notes: updatedNotes });
    },
    onError: handleError,
  });

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
      setNotes('');
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
    <div className="h-screen flex flex-col bg-background">
      <StatusBar
        isRecording={isListening}
        isProcessing={isProcessing || queueLength > 0}
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

      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-2/5">
          <TranscriptPanel
            transcript={transcript}
            isRecording={isListening}
            interimText={interimText}
          />
        </div>
        <div className="flex-1">
          <NotesPanel
            notes={notes}
            onNotesChange={setNotes}
            isProcessing={isProcessing}
          />
        </div>

        {!isListening && (notes || transcript.length > 0) && (
          <ExportMenu notes={notes} transcript={transcript.join(' ')} />
        )}
      </div>
    </div>
  );
};

export default Index;
