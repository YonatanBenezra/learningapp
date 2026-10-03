import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type AuthInputWrapProps = {
  icon: LucideIcon;
  children: ReactNode;
};

export function AuthInputWrap({ icon: Icon, children }: AuthInputWrapProps) {
  return (
    <span className="lc-auth-input-wrap">
      <Icon className="lc-auth-input-icon" strokeWidth={2} aria-hidden />
      {children}
    </span>
  );
}
