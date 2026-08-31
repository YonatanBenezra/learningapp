import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { PathsService } from './paths.service';

@Controller('paths')
export class PathsController {
  constructor(private readonly pathsService: PathsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.pathsService.list(user);
  }

  @Get(':slug')
  getBySlug(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
  ) {
    return this.pathsService.getBySlug(user, slug);
  }
}
