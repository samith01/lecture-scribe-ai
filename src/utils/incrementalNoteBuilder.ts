import { NoteSection, parseNoteStructure, rebuildMarkdown, findSectionByTopic } from './noteStructure';

export interface IncrementalUpdate {
  type: 'add_section' | 'update_section' | 'add_bullet';
  sectionTitle?: string;
  content?: string;
  bulletPoint?: string;
}

// Add normalization utility
const normalizeBullet = (bullet: string): string => {
  return bullet
    .trim()
    .replace(/^[•\-\*]\s*/, '') // Remove bullet markers
    .toLowerCase();
};

// Improved IncrementalNoteBuilder
export class IncrementalNoteBuilder {
  private sections: NoteSection[] = [];
  private contentHashes: Map<string, Set<string>> = new Map(); // section_id -> content hashes

  addOrUpdateSection(title: string, bullets: string[]): boolean {
    const normalizedTitle = title.trim();
    const existingSection = this.sections.find(
      s => s.title.toLowerCase() === normalizedTitle.toLowerCase()
    );

    if (existingSection) {
      const sectionHashes = this.contentHashes.get(existingSection.id) || new Set();
      let hasChanges = false;

      bullets.forEach(bullet => {
        const trimmed = bullet.trim();
        const hash = normalizeBullet(trimmed);
        
        if (!sectionHashes.has(hash)) {
          existingSection.content.push(trimmed);
          sectionHashes.add(hash);
          hasChanges = true;
        }
      });

      this.contentHashes.set(existingSection.id, sectionHashes);
      return hasChanges;
    } else {
      const newSection: NoteSection = {
        id: `section_${Date.now()}_${normalizedTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        title: normalizedTitle,
        level: 2,
        content: bullets.filter(b => b.trim().length > 0), // Filter empty bullets
        startIndex: 0,
        endIndex: 0,
      };

      // Store hashes for new section
      const hashes = new Set(bullets.map(b => normalizeBullet(b)));
      this.contentHashes.set(newSection.id, hashes);

      this.sections.push(newSection);
      return true;
    }
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
