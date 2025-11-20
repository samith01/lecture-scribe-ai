export interface DocumentNode {
  key: string;
  type: 'heading' | 'subheading' | 'bullet' | 'subbullet' | 'text';
  content: string;
  level: number;
  children: DocumentNode[];
  metadata?: {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
  };
}

export interface DocumentState {
  root: DocumentNode;
  keyMap: Map<string, DocumentNode>;
}

export interface NodeEdit {
  action: 'add' | 'edit' | 'delete';
  key?: string;
  parentKey?: string;
  node?: DocumentNode;
  newContent?: string;
}

export function generateKey(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createNode(
  type: DocumentNode['type'],
  content: string,
  level: number = 1,
  children: DocumentNode[] = []
): DocumentNode {
  return {
    key: generateKey(),
    type,
    content,
    level,
    children,
  };
}

export function buildDocumentState(root: DocumentNode): DocumentState {
  const keyMap = new Map<string, DocumentNode>();

  function traverse(node: DocumentNode) {
    keyMap.set(node.key, node);
    node.children.forEach(traverse);
  }

  traverse(root);

  return { root, keyMap };
}

export function applyEdit(
  state: DocumentState,
  edit: NodeEdit
): DocumentState {
  const newRoot = JSON.parse(JSON.stringify(state.root));
  const newState = buildDocumentState(newRoot);

  switch (edit.action) {
    case 'add':
      if (!edit.node || !edit.parentKey) break;
      const parent = newState.keyMap.get(edit.parentKey);
      if (parent) {
        parent.children.push(edit.node);
      }
      break;

    case 'edit':
      if (!edit.key || !edit.newContent) break;
      const nodeToEdit = newState.keyMap.get(edit.key);
      if (nodeToEdit) {
        nodeToEdit.content = edit.newContent;
      }
      break;

    case 'delete':
      if (!edit.key) break;
      const nodeToDelete = newState.keyMap.get(edit.key);
      if (nodeToDelete) {
        const parentNode = findParent(newState.root, edit.key);
        if (parentNode) {
          parentNode.children = parentNode.children.filter(
            child => child.key !== edit.key
          );
        }
      }
      break;
  }

  return buildDocumentState(newRoot);
}

function findParent(root: DocumentNode, targetKey: string): DocumentNode | null {
  for (const child of root.children) {
    if (child.key === targetKey) {
      return root;
    }
    const found = findParent(child, targetKey);
    if (found) return found;
  }
  return null;
}

export function renderToMarkdown(node: DocumentNode): string {
  let markdown = '';

  const renderNode = (n: DocumentNode, indent: number = 0): void => {
    const indentation = '  '.repeat(indent);
    let formattedContent = n.content;

    if (n.metadata?.bold) {
      formattedContent = `**${formattedContent}**`;
    }
    if (n.metadata?.italic) {
      formattedContent = `*${formattedContent}*`;
    }
    if (n.metadata?.code) {
      formattedContent = `\`${formattedContent}\``;
    }

    switch (n.type) {
      case 'heading':
        markdown += `${'#'.repeat(n.level)} ${formattedContent}\n\n`;
        break;
      case 'subheading':
        markdown += `${'#'.repeat(n.level)} ${formattedContent}\n\n`;
        break;
      case 'bullet':
        markdown += `${indentation}- ${formattedContent}\n`;
        break;
      case 'subbullet':
        markdown += `${indentation}  - ${formattedContent}\n`;
        break;
      case 'text':
        markdown += `${indentation}${formattedContent}\n`;
        break;
    }

    n.children.forEach(child => renderNode(child, indent + (n.type === 'bullet' ? 1 : 0)));
  };

  node.children.forEach(child => renderNode(child));
  return markdown.trim();
}

export function findNodeByKey(root: DocumentNode, key: string): DocumentNode | null {
  if (root.key === key) return root;

  for (const child of root.children) {
    const found = findNodeByKey(child, key);
    if (found) return found;
  }

  return null;
}

export function getAllKeys(node: DocumentNode): string[] {
  const keys: string[] = [node.key];
  node.children.forEach(child => {
    keys.push(...getAllKeys(child));
  });
  return keys;
}
