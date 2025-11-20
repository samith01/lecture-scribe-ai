import { useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TopicNode } from './mindmap/TopicNode';
import { SubtopicNode } from './mindmap/SubtopicNode';
import { BulletNode } from './mindmap/BulletNode';
import {
  MindMapNode,
  calculateTreeLayout,
  convertToReactFlowNodes,
  convertToReactFlowEdges,
} from '@/utils/mindMapStructure';

interface MindMapViewerProps {
  mindMapNodes: MindMapNode[];
  isProcessing: boolean;
}

const nodeTypes: NodeTypes = {
  topic: TopicNode,
  subtopic: SubtopicNode,
  bullet: BulletNode,
};

export const MindMapViewer = ({ mindMapNodes, isProcessing }: MindMapViewerProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  const { reactFlowNodes, reactFlowEdges } = useMemo(() => {
    if (mindMapNodes.length === 0) {
      return { reactFlowNodes: [], reactFlowEdges: [] };
    }

    const positions = calculateTreeLayout(mindMapNodes);
    const reactFlowNodes = convertToReactFlowNodes(mindMapNodes, positions);
    const reactFlowEdges = convertToReactFlowEdges(mindMapNodes);

    return { reactFlowNodes, reactFlowEdges };
  }, [mindMapNodes]);

  useEffect(() => {
    setNodes(reactFlowNodes);
    setEdges(reactFlowEdges);

    if (reactFlowNodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
      }, 100);
    }
  }, [reactFlowNodes, reactFlowEdges, setNodes, setEdges, fitView]);

  const proOptions = { hideAttribution: true };

  if (mindMapNodes.length === 0 && !isProcessing) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            Mind Map Ready
          </h3>
          <p className="text-slate-500">
            Start recording to see your lecture visualized
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-gradient-to-br from-slate-50 to-slate-100">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        proOptions={proOptions}
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          animated: false,
          style: { strokeWidth: 2 },
        }}
      >
        <Background color="#cbd5e1" gap={16} size={1} />
        <Controls
          showInteractive={false}
          className="bg-white/90 border border-slate-200 rounded-lg shadow-lg"
        />
        <MiniMap
          className="bg-white/90 border border-slate-200 rounded-lg shadow-lg"
          nodeColor={(node) => {
            if (node.type === 'topic') return '#667eea';
            if (node.type === 'subtopic') return '#f093fb';
            return '#4facfe';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {isProcessing && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-slate-200 flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-slate-700">
            Building mind map...
          </span>
        </div>
      )}
    </div>
  );
};
