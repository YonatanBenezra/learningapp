import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RagLabPreviewDto {
  @IsObject()
  payload!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  question?: string;

  /** R5: route a custom query through this class's profile. */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  queryClass?: string;

  /** R4: run the rewrite prompt on the live model (one call). */
  @IsOptional()
  @IsBoolean()
  runRewrite?: boolean;
}
