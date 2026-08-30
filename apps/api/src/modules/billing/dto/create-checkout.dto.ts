import { IsIn } from 'class-validator';

export class CreateCheckoutDto {
  @IsIn(['monthly', 'annual'])
  interval!: 'monthly' | 'annual';
}
