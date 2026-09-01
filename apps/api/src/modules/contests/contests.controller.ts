import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ContestsService } from './contests.service';
import { CreateContestAttemptDto } from './dto/create-contest-attempt.dto';

@Controller('contests')
export class ContestsController {
  constructor(private readonly contests: ContestsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.contests.list(user);
  }

  @Get(':slug')
  getBySlug(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string) {
    return this.contests.getBySlug(user, slug);
  }

  @Post(':slug/enter')
  enter(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string) {
    return this.contests.enter(user, slug);
  }

  @Get(':slug/exercises/:exerciseSlug')
  getExercise(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Param('exerciseSlug') exerciseSlug: string,
  ) {
    return this.contests.getExercise(user, slug, exerciseSlug);
  }

  @Post(':slug/attempts')
  createAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Body() dto: CreateContestAttemptDto,
  ) {
    return this.contests.createAttempt(user, slug, dto.exerciseSlug);
  }
}
