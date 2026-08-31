import type { SkillScore } from "@/types/progress";

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
            return (
              <tr key={skill.slug}>
                <td className="lp-pg-table-skill">{skill.name}</td>
                <td className={`lp-pg-table-score${blank ? " is-empty" : ""}`}>
                  {blank ? "—" : skill.score.toFixed(2)}
                </td>
                <td className="lp-pg-table-bar">
                  <div className="lp-pg-bar" aria-hidden="true">
                    <div
                      className="lp-pg-bar-fill"
                      style={{
                        width: `${Math.max(0, Math.min(skill.score, 1)) * 100}%`,
                      }}
                    />
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
