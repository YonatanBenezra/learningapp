import { RagTraceView } from "@/features/traces/components/rag-trace-view";
import {
  DEMO_RAG_TRACE,
  DEMO_TRACE_RUN_ID,
} from "@/features/traces/demo/rag-trace-demo-data";

export default function DemoRagTracePage() {
  return (
    <RagTraceView
      runId={DEMO_TRACE_RUN_ID}
      trace={DEMO_RAG_TRACE}
      demoPresentation
    />
  );
}
