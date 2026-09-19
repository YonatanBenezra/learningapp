import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

const SIMULATION_IDS = [
  'rag',
  'neural-network',
  'evaluation',
  'agent',
  'fine-tuning',
] as const;

const TAB_IDS = ['python', 'json', 'yaml'] as const;

export type SimulationPreviewId = (typeof SIMULATION_IDS)[number];
export type SimulationPreviewTab = (typeof TAB_IDS)[number];

export class SimulatorPreviewDto {
  @IsString()
  @IsIn(SIMULATION_IDS)
  simulationId!: SimulationPreviewId;

  @IsString()
  @IsIn(TAB_IDS)
  tabId!: SimulationPreviewTab;

  @IsString()
  @MinLength(1)
  @MaxLength(12_000)
  code!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slug!: string;
}

export { SIMULATION_IDS, TAB_IDS };
