import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ProgressQuery } from './dto/progress.query';
import { ProgressService } from './progress.service';

@Controller('me')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('progress')
  getMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ProgressQuery,
  ) {
    return this.progressService.getMine(user, query.timezone);
  }
}
