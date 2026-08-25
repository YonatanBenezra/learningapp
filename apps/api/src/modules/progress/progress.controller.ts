import { Controller, Get } from '@nestjs/common';
import { ProgressService } from './progress.service';

@Controller('me')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('progress')
  getMine() {
    return this.progressService.getMine('');
  }
}
