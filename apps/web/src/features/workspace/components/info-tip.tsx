"use client";

type InfoTipProps = {
  text: string;
  label?: string;
};

export function InfoTip({ text, label = "?" }: InfoTipProps) {
  return (
    <span
      className="lp-info-tip"
      tabIndex={0}
      role="note"
      aria-label={text}
      data-tooltip={text}
    >
      {label}
    </span>
  );
}
