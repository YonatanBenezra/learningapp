import { describe, it, expect } from 'vitest';
import { normalizeDomain, normalizeGeneratedCourse, parseGeneratedCourse } from '../src/modules/courses/course.normalize';
import {
  normalizeLessonContent,
  parseGeneratedLessonContent,
} from '../src/modules/courses/lesson.normalize';

describe('course.normalize', () => {
  it('maps invalid AI domain values to supported domains', () => {
    expect(normalizeDomain('AI', 'AI')).toBe('programming');
    expect(normalizeDomain('data science', 'Data')).toBe('programming');
    expect(normalizeDomain('health', 'General')).toBe('general');
    expect(normalizeDomain(undefined, 'Cyber Security')).toBe('cybersecurity');
  });

  it('normalizes a course tree with invalid module domains', () => {
    const normalized = normalizeGeneratedCourse(
      {
        title: ' Intro to AI ',
        modules: [
          {
            title: 'Foundations',
            domain: 'artificial intelligence',
            lessons: [{ title: 'Basics', summary: 'Core ideas.' }],
          },
        ],
      },
      'AI',
    );

    expect(normalized.modules[0].domain).toBe('programming');
    expect(normalized.title).toBe('Intro to AI');
  });

  it('parses lenient AI output into a strict course tree', () => {
    const parsed = parseGeneratedCourse(
      {
        title: 'Networking track',
        modules: [
          {
            title: 'Basics',
            domain: 'network',
            lessons: [{ title: 'TCP/IP', summary: 'Protocols overview.' }],
          },
        ],
      },
      'Networking',
    );

    expect(parsed.modules[0].domain).toBe('networking');
  });
});

describe('lesson.normalize', () => {
  it('pads short sections and adds visuals when requested', () => {
    const normalized = normalizeLessonContent(
      {
        summary: 'Short summary.',
        sections: [
          { title: 'Intro', body: 'Too short.' },
          { title: 'Concepts', body: 'Also short.' },
          { title: 'Practice', body: 'Still short.' },
        ],
        keyPoints: ['One', 'Two'],
      },
      { visualsPreferred: true, lessonTitle: 'Intro to Testing' },
    );

    expect(normalized.sections).toHaveLength(4);
    expect(normalized.sections.every((section) => section.body.length >= 180)).toBe(true);
    expect(normalized.sections.filter((section) => section.visual).length).toBeGreaterThanOrEqual(2);
    expect(normalized.summary.length).toBeGreaterThanOrEqual(80);
    expect(normalized.keyPoints.length).toBeGreaterThanOrEqual(4);
  });

  it('parses lenient AI lesson output', () => {
    const parsed = parseGeneratedLessonContent(
      {
        summary: 'Overview of the lesson.',
        sections: [
          {
            title: 'Intro',
            body: 'Brief intro.',
            visual: { type: 'chart', title: 'Overview', description: 'Shows the flow.' },
          },
          { title: 'Details', body: 'More detail.' },
          { title: 'Examples', body: 'Examples here.' },
        ],
        keyPoints: ['Point A', 'Point B', 'Point C'],
      },
      { visualsPreferred: true, lessonTitle: 'Sample Lesson' },
    );

    expect(parsed.sections[0].visual?.type).toBe('diagram');
    expect(parsed.sections.length).toBeGreaterThanOrEqual(4);
  });

  it('accepts null visuals from the AI provider', () => {
    const parsed = parseGeneratedLessonContent(
      {
        summary: 'Overview of the lesson.',
        sections: [
          {
            title: 'Intro',
            body: 'Brief intro.',
            visual: { type: 'diagram', title: 'Overview', description: 'Shows the flow.' },
          },
          { title: 'Details', body: 'More detail.', visual: null },
          { title: 'Examples', body: 'Examples here.' },
        ],
        keyPoints: ['Point A', 'Point B', 'Point C'],
      },
      { visualsPreferred: true, lessonTitle: 'Sample Lesson' },
    );

    expect(parsed.sections[1].visual?.type).toBe('diagram');
  });
});
