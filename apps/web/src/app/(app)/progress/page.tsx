import { AttemptHistory } from "@/features/progress/components/attempt-history";
import { SkillRadar } from "@/features/progress/components/skill-radar";

export default function ProgressPage() {
  return (
    <div className="lp-page">
      <header className="lp-page-header">
        <p className="lp-page-eyebrow">Your track record</p>
        <h1 className="lp-page-title">Progress</h1>
        <p className="lp-page-lead">
          Skill scores from graded runs and a timeline of your recent attempts.
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <SkillRadar />
        <AttemptHistory />
      </div>
    </div>
  );
}
