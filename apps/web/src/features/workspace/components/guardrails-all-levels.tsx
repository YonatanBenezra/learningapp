"use client";

/**
 * Grading sends one input to all three levels and needs every level to fall.
 * Clearing the levels one by one in the simulator with different inputs does
 * not show that, so this strip runs the current input through levels 1-3 and
 * shows which ones held. It calls the same simulator endpoints as a normal
 * run and is not graded.
 */

export type LevelCheckResult = {
  level: number;
  title: string;
  won: boolean;
  /** Short reason, e.g. "leaked" or "policy blocked". */
  note: string;
};

export type LevelCheckState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "done"; results: LevelCheckResult[] }
  | { status: "error"; message: string };

export function AllLevelsCheck({
  state,
  disabled,
  onCheck,
  label = "Check all 3 levels",
}: {
  state: LevelCheckState;
  disabled?: boolean;
  onCheck: () => void;
  label?: string;
}) {
  const pending = state.status === "pending";
  const results = state.status === "done" ? state.results : null;
  const wins = results?.filter((row) => row.won).length ?? 0;
  return (
    <div className="lp-grd-all-levels">
      <button
        type="button"
        className="lp-grd-all-levels-btn"
        disabled={disabled || pending}
        onClick={onCheck}
        title="Runs this input through levels 1-3, the way grading does. Not graded."
      >
        {pending ? "Checking…" : label}
      </button>
      {results ? (
        <div className="lp-grd-all-levels-result" role="status">
          <ul>
            {results.map((row) => (
              <li
                key={row.level}
                className={row.won ? "is-won" : "is-held"}
                title={`Level ${row.level} · ${row.title}: ${row.note}`}
              >
                <strong>L{row.level}</strong>
                <span>{row.won ? "✓" : "✗"}</span>
                <em>{row.note}</em>
              </li>
            ))}
          </ul>
          <p>
            {wins === results.length
              ? "This input wins every level, so it would pass grading."
              : `Grading needs all ${results.length} levels with this one input: ${wins} of ${results.length} fall.`}
          </p>
        </div>
      ) : null}
      {state.status === "error" ? (
        <p className="lp-grd-all-levels-error" role="alert">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
