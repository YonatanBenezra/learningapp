import { AttemptHistory } from "@/features/progress/components/attempt-history";
import { DailyDrillCard } from "@/features/progress/components/daily-drill";
import { QuotaUsage } from "@/features/progress/components/quota-usage";
import { SkillRadar } from "@/features/progress/components/skill-radar";
import { ProfileSettings } from "@/features/profile/components/profile-settings";
import "@/features/progress/progress.css";

export default function ProgressPage() {
  return (
    <div className="lp-page lp-page-progress">
      <header className="lp-cat-header">
        <h1 className="lp-cat-title">Progress</h1>
        <p className="lp-cat-lead">
          Today&apos;s drill, your streak, skill scores, and a timeline of
          recent solves.
        </p>
      </header>
      <div className="lp-pg">
        <DailyDrillCard />
        <QuotaUsage />
        <SkillRadar />
        <ProfileSettings />
        <AttemptHistory />
      </div>
    </div>
  );
}
