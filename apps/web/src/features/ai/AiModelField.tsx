'use client';

import { useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { listAiModels } from '@/src/features/ai/aiApi';
import { useTranslation } from '@/src/i18n';
import { cn } from '@/src/lib/utils';

export function AiModelField({
  value,
  onChange,
  className,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const listId = useId();
  const modelsQ = useQuery({
    queryKey: ['ai-models'],
    queryFn: listAiModels,
    staleTime: 10 * 60_000,
  });

  return (
    <div className={cn(className)}>
      <Label htmlFor={listId} className={compact ? 'text-sm' : undefined}>
        {t('settings.aiModel')}
      </Label>
      <p className={cn('text-ink-2', compact ? 'mt-1 text-xs' : 'mt-1 text-sm')}>
        {t('settings.aiModelHint')}
      </p>
      <Input
        id={listId}
        list={`${listId}-models`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="anthropic/claude-sonnet-4"
        className={cn('mt-2 font-mono text-sm', compact && 'h-10')}
      />
      <datalist id={`${listId}-models`}>
        {modelsQ.data?.models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </datalist>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="text-xs text-ink-3">{t('settings.aiModelCustom')}</p>
        <Button
          type="button"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => onChange('')}
        >
          {t('settings.aiModelDefault')}
        </Button>
      </div>
    </div>
  );
}
