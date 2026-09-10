import type { SkillScore } from "@/types/progress";
import { skillBarWidths, skillStaleNote } from "../skill-freshness";

export function SkillsTable({
  skills,
  empty = "No skill scores yet.",
}: {
  skills: SkillScore[];
  empty?: string;
}) {
  if (skills.length === 0) {
    return <p className="lp-pg-empty">{empty}</p>;
  }

  return (
    <div className="lp-pg-table-wrap">
      <table className="lp-pg-table">
        <thead>
          <tr>
            <th>Skill</th>
            <th>Score</th>
            <th className="lp-pg-table-bar">Progress</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => {
            const blank = skill.score <= 0;
            const note = skillStaleNote(skill);
            const bar = skillBarWidths(skill);
            return (
              <tr key={skill.slug}>
                <td className="lp-pg-table-skill">
                  {skill.name}
                  {note ? <span className="lp-pg-stale">{note}</span> : null}
                </td>
                <td
                  className={`lp-pg-table-score${blank ? " is-empty" : ""}`}
                  title={
                    note
                      ? `Earned ${skill.rawScore.toFixed(2)}, faded to ${skill.score.toFixed(2)}`
                      : undefined
                  }
                >
                  {blank ? "—" : skill.score.toFixed(2)}
                </td>
                <td className="lp-pg-table-bar">
                  <div className="lp-pg-bar" aria-hidden="true">
                    <div className="lp-pg-bar-raw" style={{ width: `${bar.raw}%` }}>
                      <div className="lp-pg-bar-fill" style={{ width: `${bar.fill}%` }} />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
