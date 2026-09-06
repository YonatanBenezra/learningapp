export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ag-page lp-auth-page">
      <div className="lp-auth-wrap">
        <div className="ag-rings" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="lp-auth-stage">{children}</div>
      </div>
    </div>
  );
}
