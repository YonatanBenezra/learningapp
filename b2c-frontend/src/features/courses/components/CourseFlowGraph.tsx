'use client';

// @xyflow/react wrapper — renders the Course->Module->Lesson node graph from
// GET /courses/:id/structure. Doubles as navigation. See §1.4, §5.
// NOTE: install @xyflow/react and dynamic-import this component (heavy lib).
export function CourseFlowGraph({ courseId }: { courseId: string }) {
  return <div data-component="CourseFlowGraph" data-course-id={courseId} />;
}

export default CourseFlowGraph;
