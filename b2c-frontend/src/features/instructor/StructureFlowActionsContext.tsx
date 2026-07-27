'use client';

import { createContext, useContext } from 'react';

export type StructureFlowActions = {
  editable: boolean;
  onEdit: (kind: 'module' | 'lesson', id: string, title: string) => void;
  onDelete: (kind: 'module' | 'lesson', id: string, title: string) => void;
};

const StructureFlowActionsContext = createContext<StructureFlowActions | null>(null);

export function StructureFlowActionsProvider({
  value,
  children,
}: {
  value: StructureFlowActions;
  children: React.ReactNode;
}) {
  return (
    <StructureFlowActionsContext.Provider value={value}>{children}</StructureFlowActionsContext.Provider>
  );
}

export function useStructureFlowActions() {
  const value = useContext(StructureFlowActionsContext);
  if (!value) {
    throw new Error('useStructureFlowActions must be used within StructureFlowActionsProvider');
  }
  return value;
}
