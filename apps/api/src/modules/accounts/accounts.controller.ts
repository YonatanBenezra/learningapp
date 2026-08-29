import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { UserRole } from '../../common/constants/roles';
import { Roles } from '../../common/decorators/roles.decorator';
import { AccountService } from './account.service';

@Controller('internal/accounts')
@Roles(UserRole.Admin)
export class AccountsController {
  constructor(private readonly accounts: AccountService) {}

  @Get()
  list(@Query('take') take?: string) {
    const parsed = take ? Number(take) : 50;
    return this.accounts.listReadouts(Number.isFinite(parsed) ? parsed : 50);
  }

  @Get(':userId')
  async one(@Param('userId') userId: string) {
    const row = await this.accounts.readoutFor(userId);
    if (!row) {
      throw new NotFoundException('Account not found');
    }
    return row;
  }
}
