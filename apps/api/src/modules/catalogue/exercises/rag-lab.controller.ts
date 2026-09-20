import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { RagLabPreviewDto } from './dto/rag-lab-preview.dto';
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
    return this.ragLab.preview(slug, body.payload, body.question);
  }
}
