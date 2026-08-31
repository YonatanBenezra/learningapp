import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { PROFILE_SLUG_MAX } from '../profile-slug';

export class UpdateProfileDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(40)
  displayName?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(PROFILE_SLUG_MAX)
  slug?: string | null;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
