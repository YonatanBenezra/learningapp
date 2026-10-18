import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ContestsService } from './contests.service';
import { CreateContestAttemptDto } from './dto/create-contest-attempt.dto';
import { ContestLeaderboardQueryDto } from './dto/contest-leaderboard-query.dto';

@Controller('contests')
export class ContestsController {
  constructor(private readonly contests: ContestsService) {}

  @Public()
  @Get()
  list(@CurrentUser() user?: AuthenticatedUser) {
    return this.contests.list(user);
  }

  @Public()
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Get(':slug/leaderboard/export.csv')
  exportLeaderboard(@Param('slug') slug: string) {
    return this.contests.exportLeaderboardCsv(slug);
  }

  @Public()
  @Get(':slug/leaderboard')
  leaderboard(
    @Param('slug') slug: string,
    @Query() query: ContestLeaderboardQueryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.contests.leaderboard(slug, query, user);
  }

  @Get(':slug')
  getBySlug(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
  ) {
    return this.contests.getBySlug(user, slug);
  }

  @Post(':slug/enter')
  enter(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string) {
    return this.contests.enter(user, slug);
  }

  @Get(':slug/virtual')
  getVirtual(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string) {
    return this.contests.getVirtual(user, slug);
  }

  @Get(':slug/virtual/exercises/:exerciseSlug')
  getVirtualExercise(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Param('exerciseSlug') exerciseSlug: string,
  ) {
    return this.contests.getVirtualExercise(user, slug, exerciseSlug);
  }

  @Post(':slug/virtual/attempts')
  createVirtualAttempt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Body() dto: CreateContestAttemptDto,
  ) {
    return this.contests.createVirtualAttempt(user, slug, dto.exerciseSlug);
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
