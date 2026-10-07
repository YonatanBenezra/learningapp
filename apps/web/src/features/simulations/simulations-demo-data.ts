import { routes } from "@/config/routes";
import { LIVE_RAG_FALLBACK_HREF, LIVE_RAG_PROBLEMS } from "@/config/live-rag-problems";
import { SIMULATOR_DESCRIPTIONS, SIMULATOR_LABELS } from "@/config/simulators";

export const GUARDRAILS_G1_SLUG = "grd-001-break-the-concierge";
export const GUARDRAILS_G2_SLUG = "grd-004-polite-boundary";
export const GUARDRAILS_G3_SLUG = "grd-002-the-indirect-payload";
export const GUARDRAILS_G4_SLUG = "grd-005-encoding-trick";
export const GUARDRAILS_G5_SLUG = "grd-011-bcc-smuggle";
export const GUARDRAILS_G6_SLUG = "grd-007-hex-extract";
export const GUARDRAILS_G7_SLUG = "grd-014-wilson-gate";
export const GUARDRAILS_G8_SLUG = "grd-013-filter-stack";
export const GUARDRAILS_G9_SLUG = "grd-016-policy-window";
export const GUARDRAILS_G10_SLUG = "grd-010-page-inject";
export const GUARDRAILS_G11_SLUG = "grd-015-benign-pass";

export const simulationsPageCopy = {
  title: "Simulators",
  liveCountLabel: "2 live simulators",
  lead:
    "Guardrails red-team levels and live RAG chunking problems — graded runs, traces, hidden eval.",
  promoBadges: ["Guardrails", "Prompt injection"] as const,
  promoTitle: "Break the agent. Then build the wall.",
  promoCopy:
    "Three graded levels of prompt injection, an indirect payload and a defence stack.",
  promoRun: {
    runId: "Live · graded run",
    runHref: routes.exercise(GUARDRAILS_G1_SLUG),
    exercise: "G1 · Direct injection",
    canary: { label: "canary", value: "detected", pass: true },
    attempts: "4",
  },
  footnote:
    "LabPath navy + teal — no course sidebar. G1 chat is the hero; G2/G3 use page edit and scorecard flows.",
} as const;

export const guardrailsSimulatorCard = {
  kicker: "Simulator",
  title: SIMULATOR_LABELS.guardrails,
  description: SIMULATOR_DESCRIPTIONS.guardrails,
  tags: ["prompt-injection", "CTF", "filters"] as const,
  pipeline: [
    { id: "chat", label: "Chat" },
    { id: "inject", label: "Inject" },
    { id: "detect", label: "Detect" },
    { id: "grade", label: "Grade" },
  ] as const,
  activePipelineStep: 1,
  stats: [
    { value: "11", label: "live exercises" },
    { value: "3", label: "levels in G1" },
    { value: "40", label: "hidden attacks / run" },
  ] as const,
  gradedOn: ["canary", "block rate", "benign pass", "cost"] as const,
  problemsHref: `${routes.problems}?track=guardrails`,
  startHref: `${routes.problems}?track=guardrails`,
} as const;

export const guardrailsGuidedPath = {
  title: "Guided path",
  name: "Guardrails red team",
  steps: [
    {
      id: "G1",
      label: "Direct Injection & Prompt Exfiltration",
      active: true,
      locked: false,
      href: routes.exercise(GUARDRAILS_G1_SLUG),
    },
    {
      id: "G2",
      label: "Safety Refusal & Benign UX",
      active: false,
      locked: false,
      href: routes.exercise(GUARDRAILS_G2_SLUG),
    },
    {
      id: "G3",
      label: "Indirect Injection via Retrieved Content",
      active: false,
      locked: false,
      href: routes.exercise(GUARDRAILS_G3_SLUG),
    },
    {
      id: "G4",
      label: "Obfuscation & Encoding Bypass",
      active: false,
      locked: false,
      href: routes.exercise(GUARDRAILS_G4_SLUG),
    },
    {
      id: "G5",
      label: "Tool Argument Validation",
      active: false,
      locked: false,
      href: routes.exercise(GUARDRAILS_G5_SLUG),
    },
    {
      id: "G6",
      label: "PII & Secret Canary Detection",
      active: false,
      locked: false,
      href: routes.exercise(GUARDRAILS_G6_SLUG),
    },
    {
      id: "G7",
      label: "FP/FN Wilson Gates",
      active: false,
      locked: false,
      href: routes.exercise(GUARDRAILS_G7_SLUG),
    },
    {
      id: "G8",
      label: "Defense in Depth",
      active: false,
      locked: false,
      href: routes.exercise(GUARDRAILS_G8_SLUG),
    },
    {
      id: "G9",
      label: "Multi-Turn Jailbreak",
      active: false,
      locked: false,
      href: routes.exercise(GUARDRAILS_G9_SLUG),
    },
    {
      id: "G10",
      label: "Supply-Chain Page Inject",
      active: false,
      locked: false,
      href: routes.exercise(GUARDRAILS_G10_SLUG),
    },
    {
      id: "G11",
      label: "Control Mapping & Benign Pass",
      active: false,
      locked: false,
      href: routes.exercise(GUARDRAILS_G11_SLUG),
    },
  ] as const,
  ctaHref: `${routes.problems}?track=guardrails`,
  ctaLabel: "Browse problems",
} as const;

export const ragSimulatorRow = {
  title: SIMULATOR_LABELS.rag,
  description: SIMULATOR_DESCRIPTIONS.rag,
  statLabel: `${LIVE_RAG_PROBLEMS.length} live problems`,
  problemsHref: `${routes.problems}?track=rag`,
  demoTraceHref: LIVE_RAG_PROBLEMS[0]?.href ?? LIVE_RAG_FALLBACK_HREF,
  startHref: LIVE_RAG_PROBLEMS[0]?.href ?? LIVE_RAG_FALLBACK_HREF,
  startLabel: LIVE_RAG_PROBLEMS[0]?.title
    ? `Start with ${LIVE_RAG_PROBLEMS[0].title}`
    : "Browse problems",
} as const;
