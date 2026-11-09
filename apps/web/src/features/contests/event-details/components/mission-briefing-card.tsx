import type { LobbyRule } from "@/features/contests/arena/lib/lobby-types";

function splitRule(rule: LobbyRule): { title: string; description: string } {
  const em = rule.text.indexOf(" — ");
  if (em > 0) {
    return { title: rule.text.slice(0, em), description: rule.text.slice(em + 3) };
  }
  const dot = rule.text.indexOf(". ");
  if (dot > 0 && dot < 80) {
    return {
      title: rule.text.slice(0, dot),
      description: rule.text.slice(dot + 2),
    };
  }
  return { title: rule.text, description: "" };
}

export function MissionBriefingCard({ rules }: { rules: LobbyRule[] }) {
  return (
    <section
      className="mt-7 overflow-hidden rounded-[10px] border border-[#232C3D] bg-[#0C111B]"
      aria-labelledby="mission-briefing-heading"
    >
      <div className="flex h-10 items-center justify-between border-b border-[#232C3D] bg-[#151C2B] px-4">
        <div className="flex items-center gap-2">
          <span className="flex gap-1" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#3D4659]" />
            <span className="size-2.5 rounded-full bg-[#3D4659]" />
            <span className="size-2.5 rounded-full bg-[#3D4659]" />
          </span>
          <span className="text-[#9FEF00]" aria-hidden>
            &gt;_
          </span>
          <span
            id="mission-briefing-heading"
            className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-[#A4B1CD]"
          >
            mission_briefing.md
          </span>
        </div>
        <span className="text-[11px] text-[#6B7891]">{rules.length} rules</span>
      </div>
      <div className="grid gap-px bg-[#232C3D] sm:grid-cols-2">
        {rules.map((rule) => {
          const { title, description } = splitRule(rule);
          return (
            <article key={rule.num} className="flex gap-3.5 bg-[#0C111B] p-[18px]">
              <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md border border-[#9FEF00]/25 bg-[#9FEF00]/5 font-[family-name:var(--font-jetbrains-mono)] text-xs font-semibold text-[#9FEF00]">
                {rule.num}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                {description ? (
                  <p className="mt-1 text-[13px] leading-relaxed text-[#A4B1CD]">{description}</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
