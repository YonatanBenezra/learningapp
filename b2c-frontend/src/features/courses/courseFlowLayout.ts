import type { Edge, Node } from '@xyflow/react';
import type { StructureModule } from '@/src/features/courses/coursesApi';

const COL = 280;
const nodeBase = { width: 220, borderRadius: 12, padding: 10, fontSize: 13 } as const;

export interface CourseFlowLayoutInput {
  courseTitle: string;
  modules: StructureModule[];
  lessonHref?: (lessonId: string) => string;
  pulseNodeId?: string | null;
  showGeneratingPlaceholder?: boolean;
  editable?: boolean;
}

export function buildCourseFlowGraph({
  courseTitle,
  modules,
  lessonHref,
  pulseNodeId,
  showGeneratingPlaceholder,
  editable,
}: CourseFlowLayoutInput): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const centerX = ((Math.max(modules.length, 1) - 1) * COL) / 2;

  nodes.push({
    id: 'course',
    position: { x: centerX, y: 0 },
    data: { label: courseTitle || 'Course' },
    className: pulseNodeId === 'course' ? 'course-flow-node-pulse' : undefined,
    style: {
      ...nodeBase,
      background: 'var(--primary)',
      color: 'var(--primary-ink)',
      border: 'none',
      fontWeight: 700,
    },
  });

  modules.forEach((module, moduleIndex) => {
    const moduleId = `m-${module.id}`;
    const moduleNode: Node = {
      id: moduleId,
      type: editable ? 'structure' : undefined,
      draggable: Boolean(editable),
      dragHandle: editable ? '.structure-drag-handle' : undefined,
      position: { x: moduleIndex * COL, y: 170 },
      data: {
        label: `${String(moduleIndex + 1).padStart(2, '0')} · ${module.title}`,
        kind: 'module',
        entityId: module.id,
      },
      className: pulseNodeId === moduleId ? 'course-flow-node-pulse' : undefined,
    };

    if (!editable) {
      moduleNode.style = {
        ...nodeBase,
        background: 'var(--primary-soft)',
        color: 'var(--primary)',
        border: '1px solid var(--primary)',
        fontWeight: 600,
      };
    }

    nodes.push(moduleNode);
    edges.push({ id: `e-course-${moduleId}`, source: 'course', target: moduleId });

    module.lessons.forEach((lesson, lessonIndex) => {
      const lessonId = `l-${lesson.id}`;
      const href = lessonHref?.(lesson.id);
      const lessonNode: Node = {
        id: lessonId,
        type: editable ? 'structure' : undefined,
        draggable: Boolean(editable),
        dragHandle: editable ? '.structure-drag-handle' : undefined,
        position: { x: moduleIndex * COL, y: 320 + lessonIndex * 76 },
        data: {
          label: lesson.title,
          href,
          kind: 'lesson',
          entityId: lesson.id,
          moduleId: module.id,
        },
        className: pulseNodeId === lessonId ? 'course-flow-node-pulse' : undefined,
      };

      if (!editable) {
        lessonNode.style = {
          ...nodeBase,
          background: 'var(--bg-elev)',
          color: 'var(--ink)',
          border: '1px solid var(--line-2)',
          cursor: href ? 'pointer' : 'default',
        };
      }

      nodes.push(lessonNode);
      edges.push({ id: `e-${moduleId}-${lessonId}`, source: moduleId, target: lessonId });
    });
  });

  if (showGeneratingPlaceholder) {
    const placeholderX = modules.length > 0 ? (modules.length - 1) * COL : centerX;
    const placeholderY =
      modules.length > 0
        ? 320 + (modules[modules.length - 1]?.lessons.length ?? 0) * 76
        : 170;

    nodes.push({
      id: 'generating-placeholder',
      position: { x: placeholderX, y: placeholderY },
      data: { label: modules.length === 0 ? 'Building course outline…' : 'Generating lesson…' },
      className: 'course-flow-node-pulse',
      style: {
        ...nodeBase,
        background: 'var(--bg-soft)',
        color: 'var(--primary)',
        border: '1px dashed var(--primary)',
        fontWeight: 600,
      },
    });

    if (modules.length > 0) {
      const lastModule = modules[modules.length - 1];
      const lastLesson = lastModule.lessons[lastModule.lessons.length - 1];
      edges.push({
        id: 'e-generating-placeholder',
        source: lastLesson ? `l-${lastLesson.id}` : `m-${lastModule.id}`,
        target: 'generating-placeholder',
        animated: true,
        style: { stroke: 'var(--primary)' },
      });
    } else {
      edges.push({
        id: 'e-generating-placeholder',
        source: 'course',
        target: 'generating-placeholder',
        animated: true,
        style: { stroke: 'var(--primary)' },
      });
    }
  }

  return { nodes, edges };
}

export function countStructureItems(modules: StructureModule[]) {
  const lessonCount = modules.reduce((total, module) => total + module.lessons.length, 0);
  return { moduleCount: modules.length, lessonCount };
}
