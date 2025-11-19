import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface NotesPanelProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  isProcessing: boolean;
}

export const NotesPanel = ({ notes, onNotesChange, isProcessing }: NotesPanelProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);

  useEffect(() => {
    if (!isEditing) {
      setEditedNotes(notes);
    }
  }, [notes, isEditing]);

  const handleSave = () => {
    onNotesChange(editedNotes);
    setIsEditing(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Structured Notes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isProcessing ? 'AI is organizing your notes...' : 'AI-powered note structuring'}
          </p>
        </div>
        
        {notes && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Edit
          </button>
        )}
        
        {isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditedNotes(notes);
                setIsEditing(false);
              }}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Save
            </button>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-8">
        {!notes && !isProcessing && (
          <div className="text-center text-muted-foreground py-12">
            <p>Notes will appear here as you speak</p>
            <p className="text-sm mt-2">AI will automatically organize and structure your lecture content</p>
          </div>
        )}

        {isEditing ? (
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            className="w-full min-h-[500px] p-4 bg-muted/30 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
            placeholder="Edit your notes here..."
          />
        ) : (
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
                em: ({ children }) => (
                  <em className="text-primary font-medium not-italic">{children}</em>
                ),
              }}
            >
              {notes}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
