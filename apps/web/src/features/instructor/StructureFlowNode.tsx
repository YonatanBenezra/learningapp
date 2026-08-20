'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from '@/src/i18n';
import { cn } from '@/src/lib/utils';
import { useStructureFlowActions } from '@/src/features/instructor/StructureFlowActionsContext';

export type StructureNodeData = {
  label: string;
  kind: 'module' | 'lesson';
  entityId: string;
  moduleId?: string;
  href?: string;
};

function StructureFlowNodeComponent({ data, selected }: NodeProps) {
  const { t } = useTranslation();
  const nodeData = data as StructureNodeData;
  const { editable, onEdit, onDelete } = useStructureFlowActions();
  const isModule = nodeData.kind === 'module';
  const plainTitle = isModule ? nodeData.label.replace(/^\d{2} · /, '') : nodeData.label;

  return (
    <div
      className={cn(
        'group relative w-[220px] rounded-xl border px-3 py-2.5 text-[13px] leading-snug shadow-none',
        isModule
          ? 'border-primary bg-primary-soft font-semibold text-primary'
          : 'border-line-2 bg-bg-elev text-ink',
        selected && 'ring-2 ring-primary/40',
      )}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0 !h-1 !w-1" />
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !h-1 !w-1" />

      <div className="flex items-start gap-2">
        {editable ? (
          <GripVertical className="structure-drag-handle mt-0.5 size-4 shrink-0 cursor-grab text-ink-3 active:cursor-grabbing" />
        ) : null}
        {nodeData.kind === 'lesson' && nodeData.href ? (
          <Link
            href={nodeData.href}
            className="nodrag nopan min-w-0 flex-1 break-words text-ink transition hover:text-primary hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {nodeData.label}
          </Link>
        ) : (
          <p className="min-w-0 flex-1 break-words">{nodeData.label}</p>
        )}
      </div>

      {editable ? (
        <div className="nodrag nopan mt-2 flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
          <button
            type="button"
            aria-label={t('instructor.editTitle')}
            onClick={(event) => {
              event.stopPropagation();
              onEdit(nodeData.kind, nodeData.entityId, plainTitle);
            }}
            className="grid size-7 place-items-center rounded-md border border-line text-ink-3 transition hover:border-primary hover:text-primary"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label={t('instructor.deleteItem')}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(nodeData.kind, nodeData.entityId, plainTitle);
            }}
            className="grid size-7 place-items-center rounded-md border border-line text-ink-3 transition hover:border-bad hover:text-bad"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export const StructureFlowNode = memo(StructureFlowNodeComponent);

export const structureFlowNodeTypes = {
  structure: StructureFlowNode,
};
