import { Controller, Param, Post } from '@nestjs/common';
import { HintsService } from './hints.service';

@Controller('exercises')
export class HintsController {
  constructor(private readonly hintsService: HintsService) {}

  @Post(':slug/hints/next')
  unlockNext(@Param('slug') slug: string) {
    return this.hintsService.unlockNext(slug);
  }
}
