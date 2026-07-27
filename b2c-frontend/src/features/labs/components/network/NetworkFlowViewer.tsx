'use client';

import { useMemo } from 'react';
import { AlertTriangle, Circle, Search } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { ParsedNetworkFlow } from './parseNetworkFlows';

const SEVERITY_STYLES: Record<
  ParsedNetworkFlow['severity'],
  { row: string; badge: string; label: string }
> = {
  normal: {
    row: 'hover:bg-[#252526]',
    badge: 'bg-[#2d2d2d] text-[#cccccc]',
    label: 'Normal',
  },
  elevated: {
    row: 'bg-[#3a2f14]/40 hover:bg-[#3a2f14]/60',
    badge: 'bg-[#5c4a12] text-[#fbbf24]',
    label: 'Elevated',
  },
  critical: {
    row: 'bg-[#3f1d1d]/50 hover:bg-[#3f1d1d]/70',
    badge: 'bg-[#7f1d1d] text-[#fca5a5]',
    label: 'Critical',
  },
};

export function NetworkFlowViewer({
  flows,
  visibleCount,
  selectedHost,
  onSelectHost,
}: {
  flows: ParsedNetworkFlow[];
  visibleCount: number;
  selectedHost: string | null;
  onSelectHost: (host: string | null) => void;
}) {
  const visibleFlows = useMemo(() => flows.slice(0, visibleCount), [flows, visibleCount]);

  return (
    <div className="overflow-hidden rounded-lg border border-[#2d2d2d] bg-[#1e1e1e]">
      <div className="flex items-center justify-between border-b border-[#2d2d2d] bg-[#252526] px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#858585]">
          Packet capture · Flow table
        </p>
        <p className="text-[11px] text-[#858585]">
          Showing {visibleFlows.length} / {flows.length} flows
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left font-mono text-[12px]">
          <thead className="bg-[#252526] text-[#858585]">
            <tr>
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Time</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Destination</th>
              <th className="px-3 py-2 font-medium">Proto</th>
              <th className="px-3 py-2 font-medium">Port</th>
              <th className="px-3 py-2 font-medium">Info</th>
              <th className="px-3 py-2 font-medium">Risk</th>
            </tr>
          </thead>
          <tbody>
            {visibleFlows.map((flow) => {
              const styles = SEVERITY_STYLES[flow.severity];
              const highlighted =
                selectedHost &&
                (flow.source === selectedHost || flow.destination === selectedHost);

              return (
                <tr
                  key={flow.id}
                  className={cn('border-t border-[#2d2d2d] text-[#cccccc]', styles.row, highlighted && 'ring-1 ring-inset ring-[#007F8E]/50')}
                >
                  <td className="px-3 py-2 text-[#858585]">{flow.index}</td>
                  <td className="px-3 py-2 text-[#9cdcfe]">{flow.timestamp}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onSelectHost(flow.source === selectedHost ? null : flow.source)}
                      className={cn(
                        'rounded px-1 transition hover:text-[#4ec9b0]',
                        selectedHost === flow.source && 'bg-[#007F8E]/20 text-[#4ec9b0]',
                      )}
                    >
                      {flow.source}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        onSelectHost(flow.destination === selectedHost ? null : flow.destination)
                      }
                      className={cn(
                        'rounded px-1 transition hover:text-[#4ec9b0]',
                        selectedHost === flow.destination && 'bg-[#007F8E]/20 text-[#4ec9b0]',
                      )}
                    >
                      {flow.destination}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-[#c586c0]">{flow.protocol}</td>
                  <td className="px-3 py-2 text-[#dcdcaa]">{flow.port ?? '—'}</td>
                  <td className="max-w-[280px] truncate px-3 py-2 text-[#ce9178]" title={flow.info}>
                    {flow.info}
                  </td>
                  <td className="px-3 py-2">
                    <span className={cn('rounded px-2 py-0.5 text-[10px] font-semibold uppercase', styles.badge)}>
                      {styles.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {visibleFlows.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-8 text-sm text-[#858585]">
          <Search className="size-4" />
          No flows match the current filter.
        </div>
      ) : null}
    </div>
  );
}

export function NetworkFlowStats({ flows }: { flows: ParsedNetworkFlow[] }) {
  const stats = useMemo(() => {
    const ports = new Set(flows.map((f) => f.port).filter(Boolean));
    const critical = flows.filter((f) => f.severity === 'critical').length;
    const elevated = flows.filter((f) => f.severity === 'elevated').length;
    return { ports: ports.size, critical, elevated };
  }, [flows]);

  return (
    <div className="grid grid-cols-3 gap-2">
      <StatCard label="Unique ports" value={String(stats.ports)} />
      <StatCard label="Elevated" value={String(stats.elevated)} tone="warn" />
      <StatCard label="Critical" value={String(stats.critical)} tone="bad" />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'warn' | 'bad';
}) {
  return (
    <div className="rounded-lg border border-[#2d2d2d] bg-[#252526] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#858585]">{label}</p>
      <p
        className={cn(
          'mt-1 text-lg font-bold tabular-nums',
          tone === 'warn' && 'text-[#fbbf24]',
          tone === 'bad' && 'text-[#fca5a5]',
          tone === 'default' && 'text-[#cccccc]',
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function NetworkHostList({
  hosts,
  selectedHost,
  onSelectHost,
  flowCounts,
}: {
  hosts: string[];
  selectedHost: string | null;
  onSelectHost: (host: string | null) => void;
  flowCounts: Record<string, number>;
}) {
  return (
    <div className="rounded-lg border border-[#2d2d2d] bg-[#252526] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#858585]">
        Observed hosts
      </p>
      <ul className="mt-3 space-y-1.5">
        {hosts.map((host) => (
          <li key={host}>
            <button
              type="button"
              onClick={() => onSelectHost(selectedHost === host ? null : host)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs transition',
                selectedHost === host
                  ? 'bg-[#007F8E]/20 text-[#4ec9b0]'
                  : 'text-[#cccccc] hover:bg-[#2a2d2e]',
              )}
            >
              <span className="font-mono">{host}</span>
              <span className="text-[#858585]">{flowCounts[host] ?? 0} flows</span>
            </button>
          </li>
        ))}
      </ul>
      {selectedHost ? (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#858585]">
          <Circle className="size-2 fill-[#007F8E] text-[#007F8E]" />
          Filtering table by {selectedHost}
        </p>
      ) : null}
    </div>
  );
}

export function NetworkCaptureBanner({ capturing, flowCount }: { capturing: boolean; flowCount: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#2d2d2d] bg-[#252526] px-3 py-2.5">
      <div className="flex items-center gap-2 text-xs text-[#cccccc]">
        <span
          className={cn(
            'relative grid size-2.5 place-items-center rounded-full',
            capturing ? 'bg-[#ef4444]' : 'bg-[#22c55e]',
          )}
        >
          {capturing ? (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#ef4444]/60" />
          ) : null}
        </span>
        {capturing ? 'Live capture in progress…' : 'Capture complete'}
      </div>
      <span className="flex items-center gap-1.5 text-[11px] text-[#858585]">
        {flowCount > 0 && !capturing ? <AlertTriangle className="size-3.5 text-[#fbbf24]" /> : null}
        {flowCount} packets indexed
      </span>
    </div>
  );
}
