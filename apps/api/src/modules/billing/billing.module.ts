import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeGateway } from './stripe.gateway';

@Module({
  imports: [AccountsModule],
  controllers: [BillingController],
  providers: [StripeGateway, BillingService],
})
export class BillingModule {}
