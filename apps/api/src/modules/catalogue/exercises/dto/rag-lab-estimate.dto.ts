import { IsObject } from 'class-validator';

export class RagLabEstimateDto {
  @IsObject()
  payload!: Record<string, unknown>;
}
