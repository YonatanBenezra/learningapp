import { Module } from '@nestjs/common';
import { AccountsModule } from '../../accounts/accounts.module';
import { ContestsModule } from '../../contests/contests.module';
import { TracesController } from './traces.controller';
import { TracesService } from './traces.service';

@Module({
  imports: [AccountsModule, ContestsModule],
  controllers: [TracesController],
  providers: [TracesService],
  exports: [TracesService],
})
export class TracesModule {}
