import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ContestKind } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ContestsService } from '../contests/contests.service';
import { CreateContestAttemptDto } from '../contests/dto/create-contest-attempt.dto';

@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly contests: ContestsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.contests.list(user, ContestKind.assessment);
  }

  @Get(':slug')
  getBySlug(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string) {
    return this.contests.getBySlug(user, slug, undefined, ContestKind.assessment);
  }

  @Post(':slug/enter')
  enter(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string) {
    return this.contests.enter(user, slug, undefined, ContestKind.assessment);
  }

  @Get(':slug/exercises/:exerciseSlug')
  getExercise(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Param('exerciseSlug') exerciseSlug: string,
  ) {
    return this.contests.getExercise(
      user,
      slug,
      exerciseSlug,
      ContestKind.assessment,
    );
  }

  @Post(':slug/attempts')
  createAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Body() dto: CreateContestAttemptDto,
  ) {
    return this.contests.createAttempt(
      user,
      slug,
      dto.exerciseSlug,
      undefined,
      ContestKind.assessment,
    );
  }
}
