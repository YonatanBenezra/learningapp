import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { TracesService } from './traces.service';

@Controller('runs')
export class TracesController {
  constructor(private readonly tracesService: TracesService) {}

  @Get(':id/trace')
  getByRunId(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.tracesService.getByRunId(user, id);
  }
}
