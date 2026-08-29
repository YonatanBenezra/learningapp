import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountsController } from './accounts.controller';

@Module({
  controllers: [AccountsController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountsModule {}
