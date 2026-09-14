export type LayoutView = "grid" | "list";

function GridViewIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.75" y="1.75" width="5.2" height="5.2" rx="1.1" fill="currentColor" />
      <rect x="9.05" y="1.75" width="5.2" height="5.2" rx="1.1" fill="currentColor" />
      <rect x="1.75" y="9.05" width="5.2" height="5.2" rx="1.1" fill="currentColor" />
      <rect x="9.05" y="9.05" width="5.2" height="5.2" rx="1.1" fill="currentColor" />
    </svg>
  );
}

function ListViewIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.75" y="2.4" width="12.5" height="2.5" rx="1.1" fill="currentColor" />
      <rect x="1.75" y="6.75" width="12.5" height="2.5" rx="1.1" fill="currentColor" />
      <rect x="1.75" y="11.1" width="12.5" height="2.5" rx="1.1" fill="currentColor" />
    </svg>
  );
}

export function ViewToggle({
  view,
  onChange,
  label = "Layout view",
}: {
  view: LayoutView;
  onChange: (view: LayoutView) => void;
  label?: string;
}) {
  return (
    <div className="lp-view-toggle" role="group" aria-label={label}>
      <button
        type="button"
        aria-pressed={view === "grid"}
        aria-label="Grid view"
        title="Grid view"
        onClick={() => onChange("grid")}
      >
        <GridViewIcon />
      </button>
      <button
        type="button"
        aria-pressed={view === "list"}
        aria-label="List view"
        title="List view"
        onClick={() => onChange("list")}
      >
        <ListViewIcon />
      </button>
    </div>
  );
}
