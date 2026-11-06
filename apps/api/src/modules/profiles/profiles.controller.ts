import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProfileMetaDto } from './dto/update-profile-meta.dto';
import { ProfilesService } from './profiles.service';

@Controller()
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Public()
  @Get('profiles/:slug')
  getPublic(@Param('slug') slug: string) {
    return this.profiles.getPublic(slug);
  }

  @Get('me/profile/workspace')
  workspace(@CurrentUser() user: AuthenticatedUser) {
    return this.profiles.getWorkspace(user.id);
  }

  @Patch('me/profile')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileDto,
  ) {
    return this.profiles.update(user.id, body);
  }

  @Patch('me/profile/meta')
  updateMeta(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileMetaDto,
  ) {
    return this.profiles.updateMeta(user.id, body);
  }
}
