import { Download, Copy, FileText, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ExportMenuProps {
  notes: string;
  transcript: string;
}

export const ExportMenu = ({ notes, transcript }: ExportMenuProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(notes);
      setCopied(true);
      toast({
        title: 'Copied to clipboard',
        description: 'Notes have been copied successfully',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([notes], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lecture-notes-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Downloaded',
      description: 'Notes exported as Markdown file',
    });
  };

  const handleExportTranscript = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lecture-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Downloaded',
      description: 'Transcript exported as text file',
    });
  };

  if (!notes && !transcript) return null;

  return (
    <div className="absolute top-20 right-6 flex gap-2 bg-card border border-border rounded-lg p-2 shadow-lg">
      <button
        onClick={handleCopyToClipboard}
        className="p-3 hover:bg-muted rounded-md transition-colors group relative"
        aria-label="Copy to clipboard"
      >
        {copied ? (
          <Check className="w-5 h-5 text-status-recording" />
        ) : (
          <Copy className="w-5 h-5 text-foreground" />
        )}
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Copy notes
        </span>
      </button>

      <button
        onClick={handleExportMarkdown}
        className="p-3 hover:bg-muted rounded-md transition-colors group relative"
        aria-label="Export as Markdown"
      >
        <FileText className="w-5 h-5 text-foreground" />
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Export notes
        </span>
      </button>

      <button
        onClick={handleExportTranscript}
        className="p-3 hover:bg-muted rounded-md transition-colors group relative"
        aria-label="Export transcript"
      >
        <Download className="w-5 h-5 text-foreground" />
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Export transcript
        </span>
      </button>
    </div>
  );
};
