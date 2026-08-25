import { Controller, Get, Param } from '@nestjs/common';
import { GradesService } from './grades.service';

@Controller('runs')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get(':id/grade')
  getByRunId(@Param('id') id: string) {
    return this.gradesService.getByRunId(id);
  }
}
