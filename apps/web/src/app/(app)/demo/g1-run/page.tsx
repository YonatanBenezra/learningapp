import { GuardrailsG1RunDetail } from "@/features/workspace/components/guardrails-g1-run-detail";
import { buildG1RunDetailModel } from "@/features/workspace/guardrails-g1-run-model";
import {
  DEMO_G1_RUN,
  DEMO_G1_RUN_ID,
} from "@/features/traces/demo/g1-run-demo-data";

export default function DemoG1RunPage() {
  const model = buildG1RunDetailModel(DEMO_G1_RUN, { verdict: "pass" }, DEMO_G1_RUN_ID);
  return <GuardrailsG1RunDetail model={model} />;
}
