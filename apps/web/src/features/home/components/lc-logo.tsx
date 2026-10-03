import { LabpathLogo } from "@/components/brand/labpath-logo";
import { brand } from "@/config/brand";

type LcLogoProps = {
  className?: string;
};

export function LcLogo({ className }: LcLogoProps) {
  return (
    <span className={`ag-lc-logo-wrap${className ? ` ${className}` : ""}`}>
      <LabpathLogo
        size="md"
        showWordmark
        wordmarkClassName="ag-lc-logo-name"
        className="ag-lc-logo-mark"
      />
    </span>
  );
}
