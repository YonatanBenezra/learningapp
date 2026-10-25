import { avatarColorForName } from "@/lib/arena/categories";
import { cn } from "@/lib/utils";

export type AroundRow = {
  rank: number;
  name: string;
  score: number;
  isYou?: boolean;
};

export function AroundYou({ rows, hint }: { rows: AroundRow[]; hint?: string }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--arena-line)] bg-[var(--arena-surface)]">
      <div className="border-b border-[var(--arena-line)] px-4 py-3">
        <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
          Around you
        </h2>
      </div>
      <ul>
        {rows.map((row) => (
          <li
            key={row.rank}
            className={cn(
              "flex items-center gap-2 border-t border-[var(--arena-line)] px-4 py-2",
              row.isYou &&
                "bg-[color-mix(in_srgb,var(--arena-lime)_10%,transparent)]",
            )}
          >
            <span className="w-6 font-mono text-xs font-bold text-[var(--arena-text-2)]">
              {row.rank}
            </span>
            <span
              className="flex size-6 items-center justify-center rounded-md border font-mono text-[9px] font-bold"
              style={{
                color: avatarColorForName(row.name),
                backgroundColor: `color-mix(in srgb, ${avatarColorForName(row.name)} 16%, transparent)`,
                borderColor: `color-mix(in srgb, ${avatarColorForName(row.name)} 40%, transparent)`,
              }}
            >
              {row.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-[var(--arena-ink)]">
              {row.name}
              {row.isYou ? (
                <span className="ml-1.5 rounded bg-[var(--arena-lime-fg)] px-1 py-0.5 font-mono text-[9px] font-bold uppercase text-[#070B12]">
                  you
                </span>
              ) : null}
            </span>
            <span className="font-mono text-sm font-semibold text-[var(--arena-ink)]">
              {row.score.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
      {hint ? (
        <p className="border-t border-[var(--arena-line)] px-4 py-2.5 text-center font-mono text-[11px] text-[var(--arena-lime-fg)]">
          {hint}
        </p>
      ) : null}
    </section>
  );
}
