import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { TrackOnboardingDto } from './dto/track-onboarding.dto';
import { UsersService } from './users.service';

@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user.id);
  }

  @Post('events')
  track(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: TrackOnboardingDto,
  ) {
    return this.usersService.trackOnboarding(user.id, body.name);
  }
}
