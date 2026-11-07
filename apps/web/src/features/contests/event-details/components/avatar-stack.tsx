import { cn } from "@/lib/utils";

type AvatarStackProps = {
  seeds: string[];
  className?: string;
};

function colorFor(seed: string): string {
  const palette = ["#2A3548", "#1E2636", "#3A4559", "#243044", "#323F54"];
  let n = 0;
  for (let i = 0; i < seed.length; i += 1) {
    n += seed.charCodeAt(i);
  }
  return palette[n % palette.length] ?? palette[0];
}

export function AvatarStack({ seeds, className }: AvatarStackProps) {
  const shown = seeds.slice(0, 3);
  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {shown.map((seed) => (
          <span
            key={seed}
            className="inline-flex size-6 items-center justify-center rounded-full text-[10px] font-bold uppercase text-[#A4B1CD] ring-2 ring-[#0F1520]"
            style={{ backgroundColor: colorFor(seed) }}
            aria-hidden
          >
            {seed.slice(0, 2)}
          </span>
        ))}
      </div>
    </div>
  );
}
