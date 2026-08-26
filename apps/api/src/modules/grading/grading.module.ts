import { Module } from '@nestjs/common';
import { AssertionDsl } from './dsl/assertion.dsl';
import { SliceSpecParser } from './dsl/slice-spec.parser';
import { GatewayModule } from './gateway/gateway.module';
import { EvaluationHarness } from './harnesses/evaluation/evaluation.harness';
import { GuardrailsHarness } from './harnesses/guardrails/guardrails.harness';
import { RagHarness } from './harnesses/rag/rag.harness';
import { JudgeService } from './judge/judge.service';
import { MetricsLibrary } from './metrics/metrics.library';
import { CanaryNormaliser } from './normaliser/canary.normaliser';
import { GradingPipeline } from './pipeline/grading.pipeline';
import { GradeProcessor } from './processors/grade.processor';
import { IngestProcessor } from './processors/ingest.processor';

@Module({
  imports: [GatewayModule],
  providers: [
    GradeProcessor,
    IngestProcessor,
    GradingPipeline,
    RagHarness,
    EvaluationHarness,
    GuardrailsHarness,
    AssertionDsl,
    SliceSpecParser,
    MetricsLibrary,
    JudgeService,
    CanaryNormaliser,
  ],
  exports: [GradingPipeline, GatewayModule],
})
export class GradingModule {}
