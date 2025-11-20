import { NoteSection, parseNoteStructure, rebuildMarkdown, findSectionByTopic } from './noteStructure';

export interface IncrementalUpdate {
  type: 'add_section' | 'update_section' | 'add_bullet';
  sectionTitle?: string;
  content?: string;
  bulletPoint?: string;
}

export class IncrementalNoteBuilder {
  private sections: NoteSection[] = [];
  private processedTopics: Set<string> = new Set();

  constructor(existingNotes?: string) {
    if (existingNotes && existingNotes.trim()) {
      const parsed = parseNoteStructure(existingNotes);
      this.sections = parsed.sections;
      this.sections.forEach(s => this.processedTopics.add(s.title.toLowerCase()));
    }
  }

  addOrUpdateSection(title: string, bullets: string[]): boolean {
    const normalizedTitle = title.trim();
    const existingSection = this.sections.find(
      s => s.title.toLowerCase() === normalizedTitle.toLowerCase()
    );

    if (existingSection) {
      const existingBullets = new Set(existingSection.content);
      let hasChanges = false;

      bullets.forEach(bullet => {
        if (!existingBullets.has(bullet)) {
          existingSection.content.push(bullet);
          hasChanges = true;
        }
      });

      return hasChanges;
    } else {
      const newSection: NoteSection = {
        id: `section_${Date.now()}_${normalizedTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        title: normalizedTitle,
        level: 2,
        content: bullets,
        startIndex: 0,
        endIndex: 0,
      };

      this.sections.push(newSection);
      this.processedTopics.add(normalizedTitle.toLowerCase());
      return true;
    }
  }

  addBulletToSection(sectionTitle: string, bullet: string): boolean {
    const section = findSectionByTopic(this.sections, sectionTitle);

    if (section) {
      if (!section.content.includes(bullet)) {
        section.content.push(bullet);
        return true;
      }
      return false;
    }

    return false;
  }

  getSections(): NoteSection[] {
    return this.sections;
  }

  getMarkdown(): string {
    if (this.sections.length === 0) {
      return '';
    }
    return rebuildMarkdown(this.sections);
  }

  hasContent(): boolean {
    return this.sections.length > 0;
  }

  clear(): void {
    this.sections = [];
    this.processedTopics.clear();
  }
}

export const applySmartDiff = (oldNotes: string, newNotes: string): string => {
  if (!oldNotes || oldNotes.trim().length === 0) {
    return newNotes;
  }

  const oldSections = parseNoteStructure(oldNotes).sections;
  const newSections = parseNoteStructure(newNotes).sections;

  const mergedSections: NoteSection[] = [];
  const processedNewSections = new Set<string>();

  oldSections.forEach(oldSection => {
    const matchingNewSection = newSections.find(
      ns => ns.title.toLowerCase() === oldSection.title.toLowerCase()
    );

    if (matchingNewSection) {
      const oldBullets = new Set(oldSection.content.map(c => c.trim()));
      const allBullets = [...oldSection.content];

      matchingNewSection.content.forEach(newBullet => {
        const trimmedNew = newBullet.trim();
        if (!oldBullets.has(trimmedNew)) {
          allBullets.push(newBullet);
        }
      });

      mergedSections.push({
        ...oldSection,
        content: allBullets,
      });

      processedNewSections.add(matchingNewSection.title.toLowerCase());
    } else {
      mergedSections.push(oldSection);
    }
  });

  newSections.forEach(newSection => {
    if (!processedNewSections.has(newSection.title.toLowerCase())) {
      mergedSections.push(newSection);
    }
  });

  return rebuildMarkdown(mergedSections);
};
