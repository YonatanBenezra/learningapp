import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** A G3 stack and the staged level to run it against. */
export class G3StageCheckDto {
  @IsString()
  exerciseSlug!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  level!: number;

  @IsString()
  @MaxLength(8000)
  systemPrompt!: string;

  @IsString()
  @MaxLength(8000)
  inputFilterYaml!: string;

  @IsString()
  @MaxLength(8000)
  outputFilterYaml!: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  toolPolicyYaml?: string;
}
