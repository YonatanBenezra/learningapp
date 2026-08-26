import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { GradesService } from './grades.service';

@Controller('runs')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get(':id/grade')
  getByRunId(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.gradesService.getByRunId(user, id);
  }
}
