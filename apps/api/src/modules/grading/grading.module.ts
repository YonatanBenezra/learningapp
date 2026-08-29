import { Module } from '@nestjs/common';
import { SandboxModule } from '../sandbox/sandbox.module';
import { AssertionDsl } from './dsl/assertion.dsl';
import { SliceSpecParser } from './dsl/slice-spec.parser';
import { GatewayModule } from './gateway/gateway.module';
import { EvaluationHarness } from './harnesses/evaluation/evaluation.harness';
import { GuardrailsHarness } from './harnesses/guardrails/guardrails.harness';
import { PromptEngineeringHarness } from './harnesses/prompt-engineering/prompt-engineering.harness';
import { RagHarness } from './harnesses/rag/rag.harness';
import { SandboxHarness } from './harnesses/sandbox/sandbox.harness';
import { JudgeService } from './judge/judge.service';
import { MetricsLibrary } from './metrics/metrics.library';
import { CanaryNormaliser } from './normaliser/canary.normaliser';
import { GradingPipeline } from './pipeline/grading.pipeline';
import { GradeProcessor } from './processors/grade.processor';
import { IngestProcessor } from './processors/ingest.processor';

@Module({
  imports: [GatewayModule, SandboxModule],
  providers: [
    GradeProcessor,
    IngestProcessor,
    GradingPipeline,
    RagHarness,
    SandboxHarness,
    EvaluationHarness,
    GuardrailsHarness,
    PromptEngineeringHarness,
    AssertionDsl,
    SliceSpecParser,
    MetricsLibrary,
    JudgeService,
    CanaryNormaliser,
  ],
  exports: [GradingPipeline, GatewayModule],
})
export class GradingModule {}
