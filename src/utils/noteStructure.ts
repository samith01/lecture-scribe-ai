export interface NoteSection {
  id: string;
  title: string;
  level: number;
  content: string[];
  startIndex: number;
  endIndex: number;
}

export interface NoteStructure {
  sections: NoteSection[];
  fullText: string;
}

export const parseNoteStructure = (markdown: string): NoteStructure => {
  const lines = markdown.split('\n');
  const sections: NoteSection[] = [];
  let currentSection: NoteSection | null = null;
  let sectionIdCounter = 0;

  lines.forEach((line, index) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      if (currentSection) {
        currentSection.endIndex = index - 1;
        sections.push(currentSection);
      }

      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();

      currentSection = {
        id: `section_${sectionIdCounter++}_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        title,
        level,
        content: [],
        startIndex: index,
        endIndex: index,
      };
    } else if (currentSection && line.trim()) {
      currentSection.content.push(line);
    }
  });

  if (currentSection) {
    currentSection.endIndex = lines.length - 1;
    sections.push(currentSection);
  }

  return { sections, fullText: markdown };
};

export const rebuildMarkdown = (sections: NoteSection[]): string => {
  return sections.map(section => {
    const heading = '#'.repeat(section.level) + ' ' + section.title;
    const content = section.content.join('\n');
    return `${heading}\n${content}`;
  }).join('\n\n');
};

export const findSectionByTopic = (
  sections: NoteSection[],
  topic: string
): NoteSection | null => {
  const normalizedTopic = topic.toLowerCase().replace(/[^a-z0-9\s]/g, '');

  return sections.find(section => {
    const normalizedTitle = section.title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    return normalizedTitle.includes(normalizedTopic) || normalizedTopic.includes(normalizedTitle);
  }) || null;
};

export const mergeSections = (
  existingSections: NoteSection[],
  newSection: NoteSection
): NoteSection[] => {
  const existingIndex = existingSections.findIndex(s =>
    s.title.toLowerCase() === newSection.title.toLowerCase()
  );

  if (existingIndex >= 0) {
    const merged = [...existingSections];
    const existing = merged[existingIndex];

    const uniqueContent = new Set([...existing.content, ...newSection.content]);
    merged[existingIndex] = {
      ...existing,
      content: Array.from(uniqueContent),
    };

    return merged;
  }

  return [...existingSections, newSection];
};
