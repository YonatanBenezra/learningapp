import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { ToolsService } from './tools.service';

@Controller()
export class ToolsController {
  constructor(private readonly tools: ToolsService) {}

  /** Every ladder, with the tools this learner holds. */
  @Get('tools')
  ladders(@CurrentUser() user: AuthenticatedUser) {
    return this.tools.ladders(user.id);
  }

  /** The tools an exercise's workspace shows, and which are locked. */
  @Get('exercises/:slug/tools')
  forExercise(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
  ) {
    return this.tools.forExercise(user.id, slug);
  }

  /** Unlock a tool early for rating points. */
  @Post('tools/:toolId/unlock')
  @HttpCode(200)
  unlock(
    @CurrentUser() user: AuthenticatedUser,
    @Param('toolId') toolId: string,
  ) {
    return this.tools.buy(user.id, toolId);
  }
}
