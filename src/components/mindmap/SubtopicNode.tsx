import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';

export const SubtopicNode = memo(({ data }: NodeProps) => {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-pink-500"
      />

      <div
        className="px-5 py-3 rounded-lg shadow-md border-2 border-pink-400"
        style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        }}
      >
        <div className="text-white font-semibold text-sm text-center prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{data.label}</ReactMarkdown>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-pink-500"
      />
    </div>
  );
});

SubtopicNode.displayName = 'SubtopicNode';
