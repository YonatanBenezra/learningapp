import { Module } from '@nestjs/common';
import { AccountsModule } from '../../accounts/accounts.module';
import { TracesController } from './traces.controller';
import { TracesService } from './traces.service';

@Module({
  imports: [AccountsModule],
  controllers: [TracesController],
  providers: [TracesService],
  exports: [TracesService],
})
export class TracesModule {}
