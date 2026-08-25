import { Controller, Get, Param } from '@nestjs/common';
import { RunsService } from './runs.service';

@Controller('runs')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.runsService.getById(id);
  }

  @Get(':id/stream')
  stream(@Param('id') id: string) {
    return this.runsService.stream(id);
  }
}
