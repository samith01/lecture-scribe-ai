import { Circle } from 'lucide-react';

interface StatusBarProps {
  isRecording: boolean;
  isProcessing: boolean;
  duration: number;
  onToggleRecording: () => void;
}

export const StatusBar = ({ isRecording, isProcessing, duration, onToggleRecording }: StatusBarProps) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (isRecording) return 'bg-status-recording';
    if (isProcessing) return 'bg-status-processing';
    return 'bg-status-idle';
  };

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-center px-6">
      <div className="flex items-center gap-6">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <span className="text-sm text-muted-foreground">
            {isRecording ? 'Recording' : isProcessing ? 'Processing' : 'Ready'}
          </span>
        </div>

        {/* Record button */}
        <button
          onClick={onToggleRecording}
          className={`
            w-14 h-14 rounded-full transition-all duration-300
            flex items-center justify-center
            ${isRecording 
              ? 'bg-record animate-pulse-record shadow-lg' 
              : 'bg-muted hover:bg-secondary hover:scale-105'
            }
          `}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          {isRecording ? (
            <div className="w-5 h-5 bg-record-foreground rounded-sm" />
          ) : (
            <Circle className="w-6 h-6 text-record fill-record" />
          )}
        </button>

        {/* Timer */}
        <div className="font-mono text-lg font-medium text-foreground min-w-[60px]">
          {formatDuration(duration)}
        </div>
      </div>
    </header>
  );
};
