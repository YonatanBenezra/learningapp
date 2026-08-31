import { PathStrip } from "@/features/paths/components/path-strip";

export default function PathsPage() {
  return (
    <div className="lp-page lp-page-catalogue">
      <header className="lp-cat-header">
        <h1 className="lp-cat-title">Paths</h1>
        <p className="lp-cat-lead">
          Ordered exercise sequences. No lessons. Start a path, solve the next
          open step, and stay inside your weekly quota.
        </p>
      </header>
      <PathStrip />
    </div>
  );
}
