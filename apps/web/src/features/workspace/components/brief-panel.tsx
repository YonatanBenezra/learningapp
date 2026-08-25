type BriefPanelProps = {
  slug: string;
};

export function BriefPanel({ slug }: BriefPanelProps) {
  return (
    <aside className="border-r p-4">
      <h2 className="font-medium">Brief</h2>
      <p className="mt-2 text-sm opacity-70">{slug}</p>
    </aside>
  );
}
