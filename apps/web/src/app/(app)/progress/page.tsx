import { AttemptHistory } from "@/features/progress/components/attempt-history";
import { QuotaUsage } from "@/features/progress/components/quota-usage";
import { SkillRadar } from "@/features/progress/components/skill-radar";
import "@/features/progress/progress.css";

export default function ProgressPage() {
  return (
    <div className="lp-page lp-page-progress">
      <header className="lp-cat-header">
        <h1 className="lp-cat-title">Progress</h1>
        <p className="lp-cat-lead">
          Skill scores from graded runs and a timeline of your recent attempts.
        </p>
      </header>
      <div className="lp-pg">
        <QuotaUsage />
        <SkillRadar />
        <AttemptHistory />
      </div>
    </div>
  );
}
