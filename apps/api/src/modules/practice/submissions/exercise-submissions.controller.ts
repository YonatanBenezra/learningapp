import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { listSubmissionHistory } from './submissions.service';

/** The signed-in learner's own recent submissions for one exercise. */
@Controller('exercises')
export class ExerciseSubmissionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':slug/submissions')
  list(@CurrentUser() user: AuthenticatedUser, @Param('slug') slug: string) {
    return listSubmissionHistory(this.prisma, user.id, slug);
  }
}
