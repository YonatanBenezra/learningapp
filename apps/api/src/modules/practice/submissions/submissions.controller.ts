import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { SubmissionsService } from './submissions.service';

@Controller('attempts/:attemptId/submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId', new ParseUUIDPipe()) attemptId: string,
    @Body() dto: CreateSubmissionDto,
  ) {
    return this.submissionsService.create(user, attemptId, dto);
  }
}
