import { Node, Edge } from '@xyflow/react';

export interface MindMapNode {
  id: string;
  type: 'topic' | 'subtopic' | 'bullet';
  content: string;
  level: number;
  parentId: string | null;
  children: MindMapNode[];
}

export interface LayoutPosition {
  x: number;
  y: number;
}

const NODE_COLORS = {
  topic: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: '#5a67d8',
  },
  subtopic: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    border: '#ed64a6',
  },
  bullet: {
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    border: '#4299e1',
  },
};

const NODE_DIMENSIONS = {
  topic: { width: 250, height: 80 },
  subtopic: { width: 200, height: 60 },
  bullet: { width: 180, height: 50 },
};

export function createMindMapNode(
  type: MindMapNode['type'],
  content: string,
  level: number,
  parentId: string | null = null
): MindMapNode {
  return {
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    content,
    level,
    parentId,
    children: [],
  };
}

export function calculateTreeLayout(
  nodes: MindMapNode[],
  rootX: number = 400,
  rootY: number = 50
): Map<string, LayoutPosition> {
  const positions = new Map<string, LayoutPosition>();
  const levelWidth = new Map<number, number>();

  function calculateSubtreeWidth(node: MindMapNode): number {
    if (node.children.length === 0) {
      return NODE_DIMENSIONS[node.type].width + 100;
    }

    const childrenWidth = node.children.reduce(
      (sum, child) => sum + calculateSubtreeWidth(child),
      0
    );

    return Math.max(childrenWidth, NODE_DIMENSIONS[node.type].width + 100);
  }

  function layoutNode(
    node: MindMapNode,
    x: number,
    y: number,
    availableWidth: number
  ) {
    positions.set(node.id, { x, y });

    if (node.children.length === 0) return;

    const verticalSpacing = 150;
    const childY = y + verticalSpacing;

    let currentX = x - availableWidth / 2;

    node.children.forEach((child) => {
      const childWidth = calculateSubtreeWidth(child);
      const childCenterX = currentX + childWidth / 2;

      layoutNode(child, childCenterX, childY, childWidth);
      currentX += childWidth;
    });
  }

  if (nodes.length > 0) {
    const totalWidth = calculateSubtreeWidth(nodes[0]);
    layoutNode(nodes[0], rootX, rootY, totalWidth);
  }

  return positions;
}

export function convertToReactFlowNodes(
  mindMapNodes: MindMapNode[],
  positions: Map<string, LayoutPosition>
): Node[] {
  const reactFlowNodes: Node[] = [];

  function traverse(node: MindMapNode) {
    const position = positions.get(node.id) || { x: 0, y: 0 };

    reactFlowNodes.push({
      id: node.id,
      type: node.type,
      position,
      data: {
        label: node.content,
        level: node.level,
      },
      style: {
        width: NODE_DIMENSIONS[node.type].width,
        height: NODE_DIMENSIONS[node.type].height,
      },
    });

    node.children.forEach(traverse);
  }

  mindMapNodes.forEach(traverse);
  return reactFlowNodes;
}

export function convertToReactFlowEdges(mindMapNodes: MindMapNode[]): Edge[] {
  const edges: Edge[] = [];

  function traverse(node: MindMapNode) {
    node.children.forEach((child) => {
      edges.push({
        id: `edge_${node.id}_${child.id}`,
        source: node.id,
        target: child.id,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: '#94a3b8',
          strokeWidth: 2,
        },
      });

      traverse(child);
    });
  }

  mindMapNodes.forEach(traverse);
  return edges;
}

export function findNodeById(
  nodes: MindMapNode[],
  id: string
): MindMapNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;

    const found = findNodeById(node.children, id);
    if (found) return found;
  }

  return null;
}

export function getNodeColor(type: MindMapNode['type']) {
  return NODE_COLORS[type];
}
