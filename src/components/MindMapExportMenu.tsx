import { Download, FileText, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MindMapNode } from '@/utils/mindMapStructure';
import { useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';

interface MindMapExportMenuProps {
  mindMapNodes: MindMapNode[];
  transcript: string;
}

export const MindMapExportMenu = ({ mindMapNodes, transcript }: MindMapExportMenuProps) => {
  const { toast } = useToast();
  const { getNodes } = useReactFlow();

  const convertMindMapToMarkdown = (nodes: MindMapNode[], level: number = 0): string => {
    let markdown = '';

    nodes.forEach((node) => {
      if (node.type === 'topic') {
        markdown += `\n## ${node.content}\n\n`;
      } else if (node.type === 'subtopic') {
        markdown += `\n### ${node.content}\n\n`;
      } else if (node.type === 'bullet') {
        markdown += `- ${node.content}\n`;
      }

      if (node.children.length > 0) {
        markdown += convertMindMapToMarkdown(node.children, level + 1);
      }
    });

    return markdown;
  };

  const handleExportMarkdown = () => {
    const markdown = convertMindMapToMarkdown(mindMapNodes);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmap-notes-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Mind map exported as Markdown file',
    });
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(mindMapNodes, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmap-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Mind map exported as JSON file',
    });
  };

  const handleExportImage = async () => {
    const nodesBounds = getNodesBounds(getNodes());
    const viewport = getViewportForBounds(
      nodesBounds,
      nodesBounds.width,
      nodesBounds.height,
      0.5,
      2,
      0.2
    );

    const flowElement = document.querySelector('.react-flow__viewport') as HTMLElement;

    if (!flowElement) {
      toast({
        title: 'Export failed',
        description: 'Could not find mind map element',
        variant: 'destructive',
      });
      return;
    }

    try {
      const dataUrl = await toPng(flowElement, {
        backgroundColor: '#f8fafc',
        width: nodesBounds.width * viewport.zoom + 100,
        height: nodesBounds.height * viewport.zoom + 100,
        style: {
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `mindmap-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: 'Downloaded',
        description: 'Mind map exported as PNG image',
      });
    } catch (error) {
      console.error('Export image error:', error);
      toast({
        title: 'Export failed',
        description: 'Could not export mind map as image',
        variant: 'destructive',
      });
    }
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

  if (mindMapNodes.length === 0 && !transcript) return null;

  return (
    <div className="absolute top-20 right-6 flex gap-2 bg-card border border-border rounded-lg p-2 shadow-lg">
      <button
        onClick={handleExportImage}
        className="p-3 hover:bg-muted rounded-md transition-colors group relative"
        aria-label="Export as PNG"
        disabled={mindMapNodes.length === 0}
      >
        <Image className="w-5 h-5 text-foreground" />
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Export as PNG
        </span>
      </button>

      <button
        onClick={handleExportMarkdown}
        className="p-3 hover:bg-muted rounded-md transition-colors group relative"
        aria-label="Export as Markdown"
        disabled={mindMapNodes.length === 0}
      >
        <FileText className="w-5 h-5 text-foreground" />
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Export Markdown
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
