import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { HintsService } from './hints.service';

@Controller('exercises')
export class HintsController {
  constructor(private readonly hintsService: HintsService) {}

  @Get(':slug/hints')
  list(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string) {
    return this.hintsService.list(user, slug);
  }

  @Post(':slug/hints/next')
  @HttpCode(200)
  unlockNext(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
  ) {
    return this.hintsService.unlockNext(user, slug);
  }
}
