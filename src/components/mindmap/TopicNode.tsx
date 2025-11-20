import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import ReactMarkdown from 'react-markdown';

export const TopicNode = memo(({ data }: NodeProps) => {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-500"
      />

      <div
        className="px-6 py-4 rounded-xl shadow-lg border-2 border-purple-500"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div className="text-white font-bold text-base text-center prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{data.label}</ReactMarkdown>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-purple-500"
      />
    </div>
  );
});

TopicNode.displayName = 'TopicNode';
