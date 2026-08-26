import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class G2PageDto {
  @IsString()
  pageContent!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  level?: number;
}
