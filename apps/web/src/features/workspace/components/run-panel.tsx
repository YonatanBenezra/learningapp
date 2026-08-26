"use client";

import Link from "next/link";
import { routes } from "@/config/routes";
import type { FailingCase, Grade } from "@/types/grade";
import type { Run } from "@/types/run";

type RunPanelProps = {
  run: Run | null;
  grade: Grade | null;
};

export function RunPanel({ run, grade }: RunPanelProps) {
  return (
    <aside className="overflow-y-auto border-l p-4">
      <h2 className="font-medium">Run</h2>
      {!run ? (
        <p className="mt-2 text-sm opacity-70">
          Submit a config to grade this exercise.
        </p>
      ) : (
        <p className="mt-2 text-sm">
          Status: <span className="font-medium">{run.status}</span>
          {run.errorCode ? ` (${run.errorCode})` : ""}
          {run.errorMessage ? ` — ${run.errorMessage}` : ""}
        </p>
      )}
      {run ? (
        <p className="mt-2 text-sm">
          <Link href={routes.run(run.id)} className="underline">
            Run
          </Link>
          {" · "}
          <Link href={routes.trace(run.id)} className="underline">
            Trace
          </Link>
        </p>
      ) : null}
      {grade ? <Scorecard grade={grade} /> : null}
    </aside>
  );
}

function Scorecard({ grade }: { grade: Grade }) {
  const metrics = Object.entries(grade.metrics ?? {});
  const cases = Array.isArray(grade.failingCases) ? grade.failingCases : [];

  return (
    <div className="mt-4 space-y-3 text-sm">
      <p>
        Verdict:{" "}
        <span className="font-medium uppercase" data-testid="verdict">
          {grade.verdict}
        </span>
      </p>
      {metrics.map(([key, metric]) => (
        <p key={key}>
          {key}: {Number(metric.value).toFixed(2)}
        </p>
      ))}
      {grade.failureClasses && grade.failureClasses.length > 0 ? (
        <p>Failure classes: {grade.failureClasses.join(", ")}</p>
      ) : null}
      {cases.length > 0 ? (
        <div>
          <h3 className="font-medium">Failing samples</h3>
          <ul className="mt-2 space-y-3">
            {cases.map((item) => (
              <FailingSample key={item.question} item={item} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function FailingSample({ item }: { item: FailingCase }) {
  return (
    <li className="border p-2">
      <p>{item.question}</p>
      {item.goldSpan ? (
        <p className="mt-1 opacity-70">Gold span: {item.goldSpan}</p>
      ) : null}
      {item.retrieved && item.retrieved.length > 0 ? (
        <p className="mt-1 opacity-70">
          Retrieved: {item.retrieved[0]?.slice(0, 180)}
        </p>
      ) : null}
    </li>
  );
}
