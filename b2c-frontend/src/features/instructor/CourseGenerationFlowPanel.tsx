'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Background,
  Controls,
  ReactFlow,
  useNodesState,
  type Node,
  type OnNodeDrag,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BookOpen, CheckCircle2, GripHorizontal, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ApiError } from '@/src/infrastructure/apiClient';
import { useCourseStructure } from '@/src/features/courses';
import type { StructureModule } from '@/src/features/courses/coursesApi';
import {
  buildCourseFlowGraph,
  countStructureItems,
} from '@/src/features/courses/courseFlowLayout';
import { DeleteStructureItemDialog } from '@/src/features/instructor/DeleteStructureItemDialog';
import { EditStructureTitleDialog } from '@/src/features/instructor/EditStructureTitleDialog';
import {
  structureFlowNodeTypes,
  type StructureNodeData,
} from '@/src/features/instructor/StructureFlowNode';
import { StructureFlowActionsProvider } from '@/src/features/instructor/StructureFlowActionsContext';
import {
  useDeleteInstructorLesson,
  useDeleteInstructorModule,
  useReorderInstructorStructure,
  useUpdateInstructorLessonTitle,
  useUpdateInstructorModuleTitle,
} from '@/src/features/instructor/useInstructor';

export interface GenerationActivityItem {
  id: string;
  label: string;
  kind: 'module' | 'lesson';
  at: number;
}

function collectActivityItems(modules: StructureModule[]): GenerationActivityItem[] {
  const items: GenerationActivityItem[] = [];

  modules.forEach((module) => {
    items.push({
      id: `module-${module.id}`,
      kind: 'module',
      label: `Module created: ${module.title}`,
      at: module.order,
    });
    module.lessons.forEach((lesson) => {
      items.push({
        id: `lesson-${lesson.id}`,
        kind: 'lesson',
        label: `Lesson added: ${lesson.title}`,
        at: module.order * 100 + lesson.order,
      });
    });
  });

  return items.sort((a, b) => a.at - b.at);
}

function diffNewActivity(
  previous: GenerationActivityItem[],
  current: GenerationActivityItem[],
): GenerationActivityItem[] {
  const seen = new Set(previous.map((item) => item.id));
  return current.filter((item) => !seen.has(item.id));
}

function orderFromModules(modules: StructureModule[]) {
  return {
    moduleOrder: modules.map((module) => module.id),
    lessonsByModule: Object.fromEntries(
      modules.map((module) => [module.id, module.lessons.map((lesson) => lesson.id)]),
    ),
  };
}

function orderFromNodes(nodes: Node[]) {
  const moduleNodes = nodes
    .filter((node) => node.id.startsWith('m-'))
    .sort((a, b) => a.position.x - b.position.x);

  const moduleOrder = moduleNodes.map((node) => node.id.replace('m-', ''));
  const lessonsByModule: Record<string, string[]> = {};

  for (const moduleNode of moduleNodes) {
    const moduleId = moduleNode.id.replace('m-', '');
    const lessonNodes = nodes
      .filter((node) => {
        const data = node.data as StructureNodeData;
        return data.kind === 'lesson' && data.moduleId === moduleId;
      })
      .sort((a, b) => a.position.y - b.position.y);
    lessonsByModule[moduleId] = lessonNodes.map((node) => node.id.replace('l-', ''));
  }

  return { moduleOrder, lessonsByModule };
}

function ordersEqual(
  a: { moduleOrder: string[]; lessonsByModule: Record<string, string[]> },
  b: { moduleOrder: string[]; lessonsByModule: Record<string, string[]> },
) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function snapNodes(nodes: Node[], draggedNode: Node): Node[] {
  const modulePositions = new Map<string, number>();

  for (const node of nodes) {
    if (node.id.startsWith('m-')) {
      modulePositions.set(node.id.replace('m-', ''), node.position.x);
    }
  }

  if (draggedNode.id.startsWith('m-')) {
    modulePositions.set(draggedNode.id.replace('m-', ''), draggedNode.position.x);
  }

  return nodes.map((node) => {
    const activeNode = node.id === draggedNode.id ? draggedNode : node;

    if (activeNode.id.startsWith('m-')) {
      return { ...activeNode, position: { x: activeNode.position.x, y: 170 } };
    }

    if (activeNode.id.startsWith('l-')) {
      const moduleId = (activeNode.data as StructureNodeData).moduleId;
      const moduleX = modulePositions.get(moduleId ?? '') ?? activeNode.position.x;
      return { ...activeNode, position: { x: moduleX, y: activeNode.position.y } };
    }

    return activeNode;
  });
}

type EditTarget = { kind: 'module' | 'lesson'; id: string; title: string };
type DeleteTarget = { kind: 'module' | 'lesson'; id: string; title: string };

function mutationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

export function CourseGenerationFlowPanel({
  courseId,
  courseTitle,
  isGenerating,
  className,
}: {
  courseId: string;
  courseTitle: string;
  isGenerating: boolean;
  className?: string;
}) {
  const router = useRouter();
  const editable = !isGenerating;
  const { data, isLoading, isFetching } = useCourseStructure(courseId, {
    pollWhileGenerating: isGenerating,
  });

  const modules = data?.modules ?? [];
  const counts = countStructureItems(modules);
  const [activity, setActivity] = useState<GenerationActivityItem[]>([]);
  const [pulseNodeId, setPulseNodeId] = useState<string | null>(null);
  const previousActivityRef = useRef<GenerationActivityItem[]>([]);
  const initializedRef = useRef(false);
  const isDraggingRef = useRef(false);

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [structureError, setStructureError] = useState<string | null>(null);

  const updateModule = useUpdateInstructorModuleTitle(courseId);
  const deleteModule = useDeleteInstructorModule(courseId);
  const updateLesson = useUpdateInstructorLessonTitle(courseId);
  const deleteLesson = useDeleteInstructorLesson(courseId);
  const reorderStructure = useReorderInstructorStructure(courseId);

  const openEdit = useCallback((kind: 'module' | 'lesson', id: string, title: string) => {
    setStructureError(null);
    setEditTarget({ kind, id, title });
  }, []);

  const openDelete = useCallback((kind: 'module' | 'lesson', id: string, title: string) => {
    setStructureError(null);
    setDeleteTarget({ kind, id, title });
  }, []);

  useEffect(() => {
    const current = collectActivityItems(modules);

    if (!initializedRef.current) {
      previousActivityRef.current = current;
      initializedRef.current = true;
      return;
    }

    const added = diffNewActivity(previousActivityRef.current, current);

    if (added.length > 0) {
      setActivity((prev) => [...added, ...prev].slice(0, 12));
      const latest = added[added.length - 1];
      if (latest.kind === 'module') {
        setPulseNodeId(`m-${latest.id.replace('module-', '')}`);
      } else {
        setPulseNodeId(`l-${latest.id.replace('lesson-', '')}`);
      }
    }

    previousActivityRef.current = current;
  }, [modules]);

  const layoutGraph = useMemo(
    () =>
      buildCourseFlowGraph({
        courseTitle: data?.course.title ?? courseTitle,
        modules,
        lessonHref: isGenerating ? undefined : (lessonId) => `/lesson/${lessonId}`,
        pulseNodeId,
        showGeneratingPlaceholder: isGenerating,
        editable,
      }),
    [courseTitle, data?.course.title, editable, isGenerating, modules, pulseNodeId],
  );

  const structureKey = useMemo(
    () =>
      JSON.stringify({
        title: data?.course.title ?? courseTitle,
        isGenerating,
        editable,
        pulseNodeId,
        modules: modules.map((module) => ({
          id: module.id,
          title: module.title,
          order: module.order,
          lessons: module.lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            order: lesson.order,
          })),
        })),
      }),
    [courseTitle, data?.course.title, editable, isGenerating, modules, pulseNodeId],
  );

  const flowActions = useMemo(
    () => ({ editable, onEdit: openEdit, onDelete: openDelete }),
    [editable, openDelete, openEdit],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutGraph.nodes);

  useEffect(() => {
    if (isDraggingRef.current) return;
    setNodes(layoutGraph.nodes);
  }, [structureKey, layoutGraph.nodes, setNodes]);

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const data = node.data as StructureNodeData & { href?: string };
      if (data.kind === 'lesson' && data.href) {
        router.push(data.href);
        return;
      }
      if (editable && node.type === 'structure') return;
      if (data.href) router.push(data.href);
    },
    [editable, router],
  );

  const onNodeDragStart: OnNodeDrag = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const onNodeDragStop: OnNodeDrag = useCallback(
    (_, node) => {
      isDraggingRef.current = false;
      if (!editable || reorderStructure.isPending) return;
      if (!node.id.startsWith('m-') && !node.id.startsWith('l-')) return;

      setNodes((current) => {
        const snapped = snapNodes(current, node);
        const nextOrder = orderFromNodes(snapped);
        const currentOrder = orderFromModules(modules);
        if (!ordersEqual(nextOrder, currentOrder)) {
          reorderStructure.mutate(nextOrder, {
            onError: () => setStructureError('Could not save the new order.'),
          });
        }
        return snapped;
      });
    },
    [editable, modules, reorderStructure, setNodes],
  );

  const structureBusy =
    updateModule.isPending ||
    deleteModule.isPending ||
    updateLesson.isPending ||
    deleteLesson.isPending ||
    reorderStructure.isPending;

  return (
    <section className={cn('rounded-lg border border-line bg-bg-elev', className)}>
      <div className="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {isGenerating ? 'Live generation' : 'Course structure'}
          </p>
          <h3 className="mt-1 text-lg font-bold text-ink">
            {isGenerating ? 'Building your course content' : 'Manage modules and lessons'}
          </h3>
          <p className="mt-1 text-sm text-ink-2">
            {counts.moduleCount} modules · {counts.lessonCount} lessons
            {isFetching ? ' · updating…' : ''}
          </p>
          {editable ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-3">
              <GripHorizontal className="size-3.5" />
              Drag modules horizontally or lessons vertically to reorder. Use edit/delete on each node.
            </p>
          ) : null}
        </div>
        {isGenerating ? (
          <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary-soft px-3 py-2 text-sm font-medium text-primary">
            <Loader2 className="size-4 animate-spin" />
            AI is generating
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-lg border border-good/20 bg-good-soft px-3 py-2 text-sm font-medium text-good">
            <CheckCircle2 className="size-4" />
            Generation complete
          </div>
        )}
      </div>

      {structureError ? (
        <div className="border-b border-line px-5 py-3 sm:px-6">
          <p className="rounded-lg border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad">
            {structureError}
          </p>
        </div>
      ) : null}

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative h-[min(70vh,720px)] min-h-[480px] border-b border-line xl:border-b-0 xl:border-r">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : (
            <StructureFlowActionsProvider value={flowActions}>
              <ReactFlow
                nodes={nodes}
                edges={layoutGraph.edges}
                nodeTypes={structureFlowNodeTypes}
                onNodesChange={onNodesChange}
                onNodeClick={onNodeClick}
                onNodeDragStart={onNodeDragStart}
                onNodeDragStop={onNodeDragStop}
                fitView
                fitViewOptions={{ padding: 0.25 }}
                nodesDraggable={editable}
                nodesConnectable={false}
                elementsSelectable={editable}
                minZoom={0.15}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="var(--line-2)" gap={20} />
                <Controls showInteractive={false} />
              </ReactFlow>
            </StructureFlowActionsProvider>
          )}
        </div>

        <aside className="flex min-h-[280px] flex-col p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h4 className="text-sm font-semibold text-ink">
              {isGenerating ? 'Generation activity' : 'Recent changes'}
            </h4>
          </div>

          {activity.length === 0 ? (
            <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-line bg-bg-soft/40 px-4 py-8 text-center">
              <BookOpen className="size-6 text-ink-3" />
              <p className="mt-3 text-sm font-medium text-ink">
                {isGenerating ? 'Waiting for first module…' : 'No recent generation activity'}
              </p>
              <p className="mt-1 text-xs leading-5 text-ink-2">
                {isGenerating
                  ? 'The course outline and lessons will appear here as they are created.'
                  : 'Edits you make in the diagram are saved immediately.'}
              </p>
            </div>
          ) : (
            <ul className="mt-4 flex-1 space-y-2 overflow-y-auto">
              {activity.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-line bg-bg-soft/50 px-3 py-2.5 text-sm text-ink-2"
                >
                  <span
                    className={cn(
                      'mr-2 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      item.kind === 'module'
                        ? 'bg-primary-soft text-primary'
                        : 'bg-bg-elev text-ink-3',
                    )}
                  >
                    {item.kind}
                  </span>
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <EditStructureTitleDialog
        open={Boolean(editTarget)}
        kind={editTarget?.kind ?? 'module'}
        initialTitle={editTarget?.title ?? ''}
        isSaving={updateModule.isPending || updateLesson.isPending}
        error={structureError}
        onClose={() => {
          if (structureBusy) return;
          setEditTarget(null);
          setStructureError(null);
        }}
        onSave={(title) => {
          if (!editTarget) return;
          setStructureError(null);

          if (editTarget.kind === 'module') {
            updateModule.mutate(
              { moduleId: editTarget.id, title },
              {
                onSuccess: () => setEditTarget(null),
                onError: (error) =>
                  setStructureError(mutationErrorMessage(error, 'Could not update the title.')),
              },
            );
            return;
          }

          updateLesson.mutate(
            { lessonId: editTarget.id, title },
            {
              onSuccess: () => setEditTarget(null),
              onError: (error) =>
                setStructureError(mutationErrorMessage(error, 'Could not update the title.')),
            },
          );
        }}
      />

      <DeleteStructureItemDialog
        open={Boolean(deleteTarget)}
        kind={deleteTarget?.kind ?? 'module'}
        title={deleteTarget?.title ?? ''}
        isDeleting={deleteModule.isPending || deleteLesson.isPending}
        error={structureError}
        onClose={() => {
          if (structureBusy) return;
          setDeleteTarget(null);
          setStructureError(null);
        }}
        onConfirm={() => {
          if (!deleteTarget) return;
          setStructureError(null);
          const mutation = deleteTarget.kind === 'module' ? deleteModule : deleteLesson;
          mutation.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
            onError: (error) =>
              setStructureError(mutationErrorMessage(error, 'Could not delete this item.')),
          });
        }}
      />
    </section>
  );
}

export default CourseGenerationFlowPanel;
