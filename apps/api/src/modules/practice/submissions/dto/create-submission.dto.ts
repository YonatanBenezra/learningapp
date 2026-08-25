import { IsObject } from 'class-validator';

export class CreateSubmissionDto {
  @IsObject()
  payload!: Record<string, unknown>;
}
