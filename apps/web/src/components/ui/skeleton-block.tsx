import type { CSSProperties } from "react";

type SkeletonBlockProps = {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: CSSProperties;
  circle?: boolean;
};

export function SkeletonBlock({ width, height, className = "", style, circle }: SkeletonBlockProps) {
  return (
    <span
      className={`lp-dash-figma-skel-block${className ? ` ${className}` : ""}`}
      style={{
        width,
        height,
        borderRadius: circle ? "50%" : undefined,
        ...style,
      }}
      aria-hidden
    />
  );
}
