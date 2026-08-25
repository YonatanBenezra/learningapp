import { IsInt, IsString, Min } from 'class-validator';

export class G1TurnDto {
  @IsInt()
  @Min(1)
  level!: number;

  @IsString()
  message!: string;
}
