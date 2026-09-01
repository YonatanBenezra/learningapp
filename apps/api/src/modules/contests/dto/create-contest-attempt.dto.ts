import { IsString, MinLength } from 'class-validator';

export class CreateContestAttemptDto {
  @IsString()
  @MinLength(1)
  exerciseSlug!: string;
}
