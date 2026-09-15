import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '../../common/constants/roles';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VerifyRateLimitGuard } from '../../common/guards/verify-rate-limit.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { SignedResultsService } from './signed-results.service';

class RevokeSignedResultDto {
  @IsString()
  @IsNotEmpty()
  reasonCode!: string;
}

class ShareSignedResultDto {
  @IsBoolean()
  shared!: boolean;
}

@Controller()
export class SignedResultsController {
  constructor(private readonly signedResults: SignedResultsService) {}

  @Public()
  @Get('signing-keys')
  @Header('Cache-Control', 'public, max-age=3600')
  listSigningKeys() {
    return {
      algorithm: 'ed25519',
      keys: this.signedResults.getPublicKeys(),
    };
  }

  @Get('me/assessments/results')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.signedResults.listForUser(user.id);
  }

  @Get('assessments/results/:resultId')
  async getResult(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resultId') resultId: string,
  ) {
    return this.signedResults.getForUser(resultId, user.id);
  }

  @Patch('me/assessments/results/:resultId/share')
  shareResult(
    @CurrentUser() user: AuthenticatedUser,
    @Param('resultId') resultId: string,
    @Body() dto: ShareSignedResultDto,
  ) {
    return this.signedResults.setShared(user.id, resultId, dto.shared);
  }

  @Public()
  @UseGuards(VerifyRateLimitGuard)
  @Get('assessments/results/:resultId/verify')
  @Header('Cache-Control', 'public, max-age=60')
  verifyResult(@Param('resultId') resultId: string) {
    return this.signedResults.verify(resultId);
  }

  @Post('assessments/results/:resultId/revoke')
  @Roles(UserRole.Admin)
  revokeResult(
    @Param('resultId') resultId: string,
    @Body() dto: RevokeSignedResultDto,
  ) {
    return this.signedResults.revoke(resultId, dto.reasonCode);
  }
}
