import {
  NoteNode,
  TranscriptAnalysis,
  flattenTree,
  renderToMarkdown,
  createNode,
  calculateSimilarity
} from './noteStructure';
import { analyzeTranscriptChunk } from './groqClient';

export class SmartNoteBuilder {
  private root: NoteNode;
  private processingQueue: string[] = [];
  private isProcessing: boolean = false;
  private contentHashes: Set<string> = new Set(); // Prevent duplicate bullets

  constructor() {
    this.root = createNode('', 0, false);
  }

  // Main entry point - process new transcript
  async processTranscript(transcript: string): Promise<boolean> {
    if (!transcript || transcript.trim().length < 10) {
      return false;
    }

    // Add to queue to prevent race conditions
    this.processingQueue.push(transcript);
    
    if (!this.isProcessing) {
      return await this.processQueue();
    }
    
    return true;
  }

  private async processQueue(): Promise<boolean> {
    this.isProcessing = true;
    let hasChanges = false;

    while (this.processingQueue.length > 0) {
      const transcript = this.processingQueue.shift()!;
      const changed = await this.processChunk(transcript);
      hasChanges = hasChanges || changed;
    }

    this.isProcessing = false;
    return hasChanges;
  }

  private async processChunk(transcript: string): Promise<boolean> {
    try {
      // Analyze what type of content this is
      const analysis = await analyzeTranscriptChunk(transcript);
      
      if (!analysis || analysis.confidence < 0.5) {
        return false;
      }

      if (analysis.type === 'outline') {
        // Professor is introducing topics
        return this.handleOutline(analysis);
      } else if (analysis.type === 'detail') {
        // Professor is explaining something
        return this.handleDetail(analysis);
      }

      return false;
    } catch (error) {
      console.error('Error processing chunk:', error);
      return false;
    }
  }

  private handleOutline(analysis: TranscriptAnalysis): boolean {
    if (!analysis.topics || analysis.topics.length === 0) {
      return false;
    }

    let hasChanges = false;

    analysis.topics.forEach(topic => {
      if (!topic || topic.trim().length === 0) return;

      // Check if this topic already exists
      const existing = this.findSectionByTitle(topic);
      
      if (!existing) {
        // Create new empty section
        const newNode = createNode(topic, 1, true);
        this.root.children.push(newNode);
        hasChanges = true;
      }
    });

    return hasChanges;
  }

  private handleDetail(analysis: TranscriptAnalysis): boolean {
    if (!analysis.relatedTopic || !analysis.keyPoints || analysis.keyPoints.length === 0) {
      return false;
    }

    // Find best matching section
    const targetSection = this.findBestMatch(analysis.relatedTopic);
    
    if (!targetSection) {
      // If no match found, create new section and add details
      const newNode = createNode(analysis.relatedTopic, 1, false);
      this.addBulletsToNode(newNode, analysis.keyPoints);
      this.root.children.push(newNode);
      return true;
    }

    // Add bullets to existing section
    return this.addBulletsToNode(targetSection, analysis.keyPoints);
  }

  private addBulletsToNode(node: NoteNode, bullets: string[]): boolean {
    let hasChanges = false;

    bullets.forEach(bullet => {
      const cleaned = bullet.trim().replace(/^[•\-\*]\s*/, '');
      if (cleaned.length === 0) return;

      // Check for duplicates using content hash
      const hash = this.hashContent(cleaned);
      
      if (!this.contentHashes.has(hash)) {
        node.bullets.push(cleaned);
        this.contentHashes.add(hash);
        hasChanges = true;
        
        // Mark section as no longer empty
        if (node.isEmpty) {
          node.isEmpty = false;
        }
      }
    });

    return hasChanges;
  }

  private hashContent(content: string): string {
    // Simple hash: normalize and lowercase
    return content.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private findSectionByTitle(title: string): NoteNode | null {
    const allSections = flattenTree(this.root);
    const normalized = title.toLowerCase().trim();

    return allSections.find(section => 
      section.title.toLowerCase().trim() === normalized
    ) || null;
  }

  private findBestMatch(topic: string): NoteNode | null {
    const allSections = flattenTree(this.root);
    
    if (allSections.length === 0) {
      return null;
    }

    let bestMatch: NoteNode | null = null;
    let highestScore = 0.6; // Minimum threshold

    allSections.forEach(section => {
      const score = calculateSimilarity(topic, section.title);
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = section;
      }
    });

    return bestMatch;
  }

  // Get current notes as markdown
  getMarkdown(): string {
    if (this.root.children.length === 0) {
      return '';
    }
    return renderToMarkdown(this.root);
  }

  // Get structured data
  getStructure(): NoteNode {
    return this.root;
  }

  // Check if has content
  hasContent(): boolean {
    return this.root.children.length > 0;
  }

  // Clear all notes
  clear(): void {
    this.root = createNode('', 0, false);
    this.contentHashes.clear();
    this.processingQueue = [];
  }

  // Export for debugging
  exportDebugInfo(): any {
    return {
      totalSections: flattenTree(this.root).length,
      totalBullets: this.countTotalBullets(this.root),
      structure: this.root,
      queueLength: this.processingQueue.length,
      isProcessing: this.isProcessing
    };
  }

  private countTotalBullets(node: NoteNode): number {
    let count = node.bullets.length;
    node.children.forEach(child => {
      count += this.countTotalBullets(child);
    });
    return count;
  }
}
