import { IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RagLabPreviewDto {
  @IsObject()
  payload!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  question?: string;
}
