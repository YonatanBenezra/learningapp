import { Module } from '@nestjs/common';
import { AccountsModule } from '../../accounts/accounts.module';
import { HintsController } from './hints.controller';
import { HintsService } from './hints.service';

@Module({
  imports: [AccountsModule],
  controllers: [HintsController],
  providers: [HintsService],
  exports: [HintsService],
})
export class HintsModule {}
