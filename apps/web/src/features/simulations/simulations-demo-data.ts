import { routes } from "@/config/routes";
import { LIVE_RAG_PROBLEMS } from "@/config/live-rag-problems";
import { SIMULATOR_DESCRIPTIONS, SIMULATOR_LABELS } from "@/config/simulators";

export const GUARDRAILS_G1_SLUG = "grd-001-break-the-concierge";
export const GUARDRAILS_G2_SLUG = "grd-002-the-indirect-payload";
export const GUARDRAILS_G3_SLUG = "grd-003-hold-the-line";

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
    runId: "run_g1_4c2e…9f1a",
    runHref: routes.demoG1Run,
    exercise: "G1 · level 2",
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
    { value: "3", label: "exercises · G1–G3" },
    { value: "3", label: "levels in G1" },
    { value: "40", label: "hidden attacks / run" },
  ] as const,
  gradedOn: ["canary", "block rate", "benign pass", "cost"] as const,
  problemsHref: `${routes.problems}?track=guardrails`,
  startHref: routes.exercise(GUARDRAILS_G1_SLUG),
} as const;

export const guardrailsGuidedPath = {
  title: "Guided path",
  name: "Guardrails red team",
  steps: [
    {
      id: "G1",
      label: "Break the Concierge",
      active: true,
      locked: false,
      href: routes.exercise(GUARDRAILS_G1_SLUG),
    },
    {
      id: "G2",
      label: "The Indirect Payload",
      active: false,
      locked: true,
      href: routes.exercise(GUARDRAILS_G2_SLUG),
    },
    {
      id: "G3",
      label: "Hold the Line",
      active: false,
      locked: true,
      href: routes.exercise(GUARDRAILS_G3_SLUG),
    },
  ] as const,
  ctaHref: routes.exercise(GUARDRAILS_G1_SLUG),
  ctaLabel: "Start with G1",
} as const;

export const ragSimulatorRow = {
  title: SIMULATOR_LABELS.rag,
  description: SIMULATOR_DESCRIPTIONS.rag,
  statLabel: `${LIVE_RAG_PROBLEMS.length} live problems`,
  problemsHref: `${routes.problems}?track=rag`,
  demoTraceHref: routes.demoRagTrace,
  startHref: LIVE_RAG_PROBLEMS[0].href,
  startLabel: `Start with ${LIVE_RAG_PROBLEMS[0].title}`,
} as const;
