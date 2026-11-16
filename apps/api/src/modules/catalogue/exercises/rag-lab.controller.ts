import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { RagLabEstimateDto } from './dto/rag-lab-estimate.dto';
import { RagLabPreviewDto } from './dto/rag-lab-preview.dto';
import { RagLabTargetDto } from './dto/rag-lab-target.dto';
import { RagLabService } from './rag-lab.service';

@Controller('exercises/:slug/rag-lab')
export class RagLabController {
  constructor(private readonly ragLab: RagLabService) {}

  @Public()
  @Get()
  getContext(@Param('slug') slug: string) {
    return this.ragLab.getContext(slug);
  }

  @Public()
  @Post('preview')
  preview(@Param('slug') slug: string, @Body() body: RagLabPreviewDto) {
    return this.ragLab.preview(
      slug,
      body.payload,
      body.question,
      body.queryClass,
    );
  }

  /** Red team: send one message to the vulnerable target bot (signed-in only). */
  @Post('target')
  @HttpCode(200)
  target(@Param('slug') slug: string, @Body() body: RagLabTargetDto) {
    return this.ragLab.target(slug, body.message);
  }

  /** Current config over all public sample questions (ungraded). */
  @Public()
  @Post('estimate')
  estimate(@Param('slug') slug: string, @Body() body: RagLabEstimateDto) {
    return this.ragLab.estimate(slug, body.payload);
  }
}
