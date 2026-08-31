import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ProgressQuery {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;
}
