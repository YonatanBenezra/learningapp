'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Background, Controls, ReactFlow, type Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { learnerCoursePath } from '@/src/features/auth/learnerRoutes';
import { useCourseStructure } from '@/src/features/courses';
import { useTranslation } from '@/src/i18n';
import { buildCourseFlowGraph } from '@/src/features/courses/courseFlowLayout';

export default function CourseFlowGraph({ courseId }: { courseId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading } = useCourseStructure(courseId);
  const status = data?.course.status;

  const { nodes, edges } = useMemo(
    () =>
      buildCourseFlowGraph({
        courseTitle: data?.course.title ?? t('player.course'),
        modules: data?.modules ?? [],
        lessonHref: (lessonId) => `/lesson/${lessonId}`,
      }),
    [data, t],
  );

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const href = (node.data as { href?: string }).href;
      if (href) router.push(href);
    },
    [router],
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (status && status !== 'ready' && status !== 'completed') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-ink-2">{t('player.courseNotReady')}</p>
        <Link
          href={learnerCoursePath(courseId)}
          className="text-sm font-semibold text-primary hover:underline"
        >
          {t('player.backToCourse')}
        </Link>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Link
        href={learnerCoursePath(courseId)}
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg-elev px-3 py-2 text-sm font-medium text-ink hover:text-primary"
      >
        <ArrowLeft className="size-4" /> {t('player.course')}
      </Link>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--line-2)" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
