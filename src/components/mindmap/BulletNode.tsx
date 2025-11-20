import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';
import { Circle } from 'lucide-react';

export const BulletNode = memo(({ data }: NodeProps) => {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-blue-500"
      />

      <div
        className="px-4 py-2 rounded-lg shadow border-2 border-blue-400 flex items-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        }}
      >
        <Circle className="w-2 h-2 fill-white text-white flex-shrink-0" />
        <div className="text-white text-xs font-medium prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{data.label}</ReactMarkdown>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-blue-500"
      />
    </div>
  );
});

BulletNode.displayName = 'BulletNode';
