import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  me() {
    return this.usersService.getMe('');
  }
}
