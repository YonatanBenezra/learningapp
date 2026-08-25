import { Body, Controller, Param, Post } from '@nestjs/common';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { SubmissionsService } from './submissions.service';

@Controller('attempts/:attemptId/submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  create(
    @Param('attemptId') attemptId: string,
    @Body() dto: CreateSubmissionDto,
  ) {
    return this.submissionsService.create(attemptId, dto);
  }
}
