import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import {
  RateLimit,
  UserRateLimitGuard,
} from '../../../common/guards/user-rate-limit.guard';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { RagLabEstimateDto } from './dto/rag-lab-estimate.dto';
import { RagLabPreviewDto } from './dto/rag-lab-preview.dto';
import { RagLabTargetDto } from './dto/rag-lab-target.dto';
import { RagLabService } from './rag-lab.service';

const MINUTE = 60_000;

/**
 * Lab endpoints run the grader's engine (and, for R3, a live model), so all of
 * them except the read-only context need a signed-in learner and are rate
 * limited per learner.
 */
@Controller('exercises/:slug/rag-lab')
@UseGuards(UserRateLimitGuard)
export class RagLabController {
  constructor(private readonly ragLab: RagLabService) {}

  @Public()
  @Get()
  getContext(@Param('slug') slug: string) {
    return this.ragLab.getContext(slug);
  }

  @Post('preview')
  @RateLimit({ bucket: 'rag-lab-preview', max: 60, windowMs: MINUTE })
  preview(@Param('slug') slug: string, @Body() body: RagLabPreviewDto) {
    return this.ragLab.preview(
      slug,
      body.payload,
      body.question,
      body.queryClass,
    );
  }

  /** Red team: send one message to the vulnerable target bot. */
  @Post('target')
  @HttpCode(200)
  @RateLimit({ bucket: 'rag-lab-target', max: 30, windowMs: MINUTE })
  target(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Body() body: RagLabTargetDto,
  ) {
    return this.ragLab.target(slug, body.message, user.id);
  }

  /** Current config over all public sample questions (ungraded). */
  @Post('estimate')
  @RateLimit({ bucket: 'rag-lab-estimate', max: 120, windowMs: MINUTE })
  estimate(@Param('slug') slug: string, @Body() body: RagLabEstimateDto) {
    return this.ragLab.estimate(slug, body.payload);
  }
}
