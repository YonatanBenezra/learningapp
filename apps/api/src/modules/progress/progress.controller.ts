import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ProgressService } from './progress.service';

@Controller('me')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('progress')
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.progressService.getMine(user);
  }
}
