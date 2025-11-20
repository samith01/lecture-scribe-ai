export interface TextChange {
  type: 'add_heading' | 'add_bullet' | 'edit_line' | 'delete_line';
  lineIndex?: number;
  heading?: string;
  bullet?: string;
  newText?: string;
  sectionHeading?: string;
}

export interface StreamState {
  content: string;
  cursorLine: number;
  isAnimating: boolean;
}

export class TextStreamAnimator {
  private content: string = '';
  private isAnimating: boolean = false;
  private animationQueue: TextChange[] = [];
  private onUpdate: (state: StreamState) => void;
  private animationFrame: number | null = null;

  constructor(onUpdate: (state: StreamState) => void) {
    this.onUpdate = onUpdate;
  }

  queueChanges(changes: TextChange[]) {
    this.animationQueue.push(...changes);
    if (!this.isAnimating) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.animationQueue.length === 0) {
      this.isAnimating = false;
      this.notifyUpdate(-1);
      return;
    }

    this.isAnimating = true;
    const change = this.animationQueue.shift()!;

    await this.animateChange(change);
    setTimeout(() => this.processQueue(), 50);
  }

  private async animateChange(change: TextChange) {
    switch (change.type) {
      case 'add_heading':
        await this.animateAddHeading(change.heading!, change.sectionHeading);
        break;
      case 'add_bullet':
        await this.animateAddBullet(change.bullet!, change.sectionHeading);
        break;
      case 'edit_line':
        await this.animateEditLine(change.lineIndex!, change.newText!);
        break;
      case 'delete_line':
        await this.animateDeleteLine(change.lineIndex!);
        break;
    }
  }

  private async animateAddHeading(heading: string, sectionHeading?: string) {
    const lines = this.content.split('\n').filter(l => l.trim());

    let insertIndex = lines.length;
    if (sectionHeading) {
      const sectionIndex = lines.findIndex(l => l.includes(sectionHeading));
      if (sectionIndex !== -1) {
        insertIndex = sectionIndex + 1;
        while (insertIndex < lines.length && lines[insertIndex].startsWith('- ')) {
          insertIndex++;
        }
      }
    }

    const fullHeading = `## ${heading}`;

    lines.splice(insertIndex, 0, '');
    this.content = lines.join('\n');
    this.notifyUpdate(insertIndex);
    await this.sleep(100);

    for (let i = 0; i <= fullHeading.length; i++) {
      lines[insertIndex] = fullHeading.substring(0, i);
      this.content = lines.join('\n');
      this.notifyUpdate(insertIndex);
      await this.sleep(30);
    }

    await this.sleep(200);
  }

  private async animateAddBullet(bullet: string, sectionHeading?: string) {
    const lines = this.content.split('\n').filter(l => l.trim());

    let insertIndex = lines.length;

    if (sectionHeading) {
      const normalizedSection = sectionHeading.replace(/^#+\s*/, '').trim();
      const sectionIndex = lines.findIndex(l =>
        l.replace(/^#+\s*/, '').trim() === normalizedSection
      );

      if (sectionIndex !== -1) {
        insertIndex = sectionIndex + 1;
        while (insertIndex < lines.length && lines[insertIndex].startsWith('- ')) {
          insertIndex++;
        }
      }
    }

    const fullBullet = `- ${bullet}`;

    lines.splice(insertIndex, 0, '');
    this.content = lines.join('\n');
    this.notifyUpdate(insertIndex);
    await this.sleep(100);

    for (let i = 0; i <= fullBullet.length; i++) {
      lines[insertIndex] = fullBullet.substring(0, i);
      this.content = lines.join('\n');
      this.notifyUpdate(insertIndex);
      await this.sleep(20);
    }

    await this.sleep(150);
  }

  private async animateEditLine(lineIndex: number, newText: string) {
    const lines = this.content.split('\n');

    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const oldText = lines[lineIndex];
    this.notifyUpdate(lineIndex);
    await this.sleep(100);

    for (let i = oldText.length; i >= 0; i--) {
      lines[lineIndex] = oldText.substring(0, i);
      this.content = lines.join('\n');
      this.notifyUpdate(lineIndex);
      await this.sleep(15);
    }

    await this.sleep(100);

    for (let i = 0; i <= newText.length; i++) {
      lines[lineIndex] = newText.substring(0, i);
      this.content = lines.join('\n');
      this.notifyUpdate(lineIndex);
      await this.sleep(20);
    }

    await this.sleep(200);
  }

  private async animateDeleteLine(lineIndex: number) {
    const lines = this.content.split('\n');

    if (lineIndex < 0 || lineIndex >= lines.length) return;

    const text = lines[lineIndex];
    this.notifyUpdate(lineIndex);
    await this.sleep(100);

    for (let i = text.length; i >= 0; i--) {
      lines[lineIndex] = text.substring(0, i);
      this.content = lines.join('\n');
      this.notifyUpdate(lineIndex);
      await this.sleep(15);
    }

    lines.splice(lineIndex, 1);
    this.content = lines.join('\n');
    this.notifyUpdate(-1);
    await this.sleep(100);
  }

  private notifyUpdate(cursorLine: number) {
    this.onUpdate({
      content: this.content,
      cursorLine,
      isAnimating: this.isAnimating,
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getCurrentContent(): string {
    return this.content;
  }

  isCurrentlyAnimating(): boolean {
    return this.isAnimating;
  }

  clear() {
    this.content = '';
    this.isAnimating = false;
    this.animationQueue = [];
    this.notifyUpdate(-1);
  }
}
