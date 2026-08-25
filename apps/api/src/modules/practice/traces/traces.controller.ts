import { Controller, Get, Param } from '@nestjs/common';
import { TracesService } from './traces.service';

@Controller('runs')
export class TracesController {
  constructor(private readonly tracesService: TracesService) {}

  @Get(':id/trace')
  getByRunId(@Param('id') id: string) {
    return this.tracesService.getByRunId(id);
  }
}
