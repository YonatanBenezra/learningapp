import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Public()
  @Get()
  list() {
    return this.leaderboard.list();
  }
}
