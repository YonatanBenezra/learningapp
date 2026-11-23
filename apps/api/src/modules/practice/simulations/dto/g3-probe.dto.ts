import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class G3ProbeDto {
  @IsString()
  exerciseSlug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;

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
