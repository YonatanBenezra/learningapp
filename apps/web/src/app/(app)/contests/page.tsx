import { ContestStrip } from "@/features/contests/components/contest-strip";

export default function ContestsPage() {
  return (
    <div className="lp-page lp-page-catalogue">
      <header className="lp-cat-header">
        <h1 className="lp-cat-title">Contests</h1>
        <p className="lp-cat-lead">
          Timed, ranked seasons with novel problems sampled from a hidden pool.
          Pro only. Hints are off during contest attempts.
        </p>
      </header>
      <ContestStrip />
    </div>
  );
}
