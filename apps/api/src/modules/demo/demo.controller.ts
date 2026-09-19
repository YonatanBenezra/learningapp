import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { SimulatorPreviewDto } from './dto/simulator-preview.dto';
import { SimulatorPreviewGuard } from './simulator-preview.guard';
import { SimulatorPreviewService } from './simulator-preview.service';

@Controller('demo')
export class DemoController {
  constructor(private readonly preview: SimulatorPreviewService) {}

  @Public()
  @UseGuards(SimulatorPreviewGuard)
  @Post('simulator-preview')
  grade(@Body() body: SimulatorPreviewDto) {
    return this.preview.grade(body);
  }
}
