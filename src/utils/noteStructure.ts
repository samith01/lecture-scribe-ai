export interface NoteNode {
  id: string;
  title: string;
  depth: number; // 0=root, 1=main topic, 2=subtopic
  bullets: string[];
  children: NoteNode[];
  isEmpty: boolean; // Visual indicator for empty sections
  createdAt: number; // Timestamp for ordering
}

export interface TranscriptAnalysis {
  type: 'outline' | 'detail' | 'transition';
  topics?: string[]; // For outline type
  relatedTopic?: string; // For detail type
  keyPoints?: string[]; // For detail type
  confidence: number; // 0-1 score
}

// Normalize text for comparison
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
};

// Calculate semantic similarity between two strings (simple version)
export const calculateSimilarity = (text1: string, text2: string): number => {
  const norm1 = normalizeText(text1);
  const norm2 = normalizeText(text2);
  
  // Exact match
  if (norm1 === norm2) return 1.0;
  
  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;
  
  // Word overlap scoring
  const words1 = new Set(norm1.split(' '));
  const words2 = new Set(norm2.split(' '));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  // Jaccard similarity
  return intersection.size / union.size;
};

// Flatten tree for searching
export const flattenTree = (node: NoteNode): NoteNode[] => {
  const result: NoteNode[] = [];
  
  if (node.title) {
    result.push(node);
  }
  
  node.children.forEach(child => {
    result.push(...flattenTree(child));
  });
  
  return result;
};

// Render tree to markdown with proper spacing
export const renderToMarkdown = (node: NoteNode, level: number = 0): string => {
  let output = '';
  
  // Render heading with proper spacing
  if (node.title && level > 0) {
    output += '#'.repeat(level) + ' ' + node.title + '\n\n';
    
    // If section is empty, show placeholder
    if (node.isEmpty && node.bullets.length === 0 && node.children.length === 0) {
      output += '*Waiting for details...*\n\n';
    }
  }
  
  // Render bullets
  if (node.bullets.length > 0) {
    node.bullets.forEach(bullet => {
      const cleanBullet = bullet.trim().replace(/^[•\-\*]\s*/, '');
      output += '- ' + cleanBullet + '\n';
    });
    output += '\n'; // Add spacing after bullets
  }
  
  // Recursively render children
  node.children.forEach(child => {
    output += renderToMarkdown(child, level + 1);
  });
  
  return output;
};

// Create empty node
export const createNode = (
  title: string,
  depth: number,
  isEmpty: boolean = false
): NoteNode => {
  return {
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: title.trim(),
    depth,
    bullets: [],
    children: [],
    isEmpty,
    createdAt: Date.now()
  };
};
