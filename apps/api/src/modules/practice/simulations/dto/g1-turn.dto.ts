import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class G1TurnDto {
  @IsInt()
  @Min(1)
  level!: number;

  @IsString()
  @MaxLength(8000)
  message!: string;

  /** Live G1 simulator — tailors refusal copy and leak heuristics per catalogue exercise. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  exerciseSlug?: string;
}
