import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  attemptBudgetForSlug,
  listSubmissionHistory,
} from './submissions.service';

/** The signed-in learner's own recent submissions for one exercise. */
@Controller('exercises')
export class ExerciseSubmissionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':slug/submissions')
  list(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string) {
    return listSubmissionHistory(this.prisma, user.id, slug);
  }

  /** How many graded submissions are left in the current attempt-policy window. */
  @Get(':slug/attempt-budget')
  attemptBudget(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
  ) {
    return attemptBudgetForSlug(this.prisma, user.id, slug);
  }
}
