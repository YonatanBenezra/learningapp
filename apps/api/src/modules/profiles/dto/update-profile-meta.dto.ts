import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class SocialDto {
  @IsString()
  @MaxLength(40)
  platform!: string;

  @IsString()
  @MaxLength(500)
  url!: string;
}

class CertificationDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  issuer?: string;

  @IsOptional()
  @IsString()
  earnedAt?: string;
}

class AchievementDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  earnedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

class EventDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  date?: string;
}

class AccountSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  callingCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  isc2MemberId?: string;

  @IsOptional()
  @IsBoolean()
  openToWork?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  jobTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  yearsExperience?: string;
}

class BadgeDto {
  @IsString()
  @MaxLength(80)
  id!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  earnedAt?: string;

  @IsOptional()
  @IsNumber()
  rarityPct?: number;

  @IsIn(['labs', 'academy', 'event'])
  category!: 'labs' | 'academy' | 'event';
}

export class UpdateProfileMetaDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AccountSettingsDto)
  accountSettings?: AccountSettingsDto;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  coverUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialDto)
  socials?: SocialDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tools?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificationDto)
  certifications?: CertificationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AchievementDto)
  achievements?: AchievementDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventDto)
  events?: EventDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BadgeDto)
  badges?: BadgeDto[];
}
