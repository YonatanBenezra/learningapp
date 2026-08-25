import { AttemptHistory } from "@/features/progress/components/attempt-history";
import { SkillRadar } from "@/features/progress/components/skill-radar";

export default function ProgressPage() {
  return (
    <main className="grid gap-4 p-8 lg:grid-cols-2">
      <h1 className="col-span-full text-2xl font-semibold tracking-tight">
        Progress
      </h1>
      <SkillRadar />
      <AttemptHistory />
    </main>
  );
}
