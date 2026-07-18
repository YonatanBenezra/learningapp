export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1">
      {/* TODO: sidebar / topbar navigation */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
