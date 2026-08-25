import { Body, Controller, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConsumeMagicLinkDto } from './dto/consume-magic-link.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestMagicLinkDto } from './dto/request-magic-link.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('magic-link')
  requestMagicLink(@Body() dto: RequestMagicLinkDto) {
    return this.authService.requestMagicLink(dto.email);
  }

  @Post('magic-link/consume')
  consumeMagicLink(@Body() dto: ConsumeMagicLinkDto) {
    return this.authService.consumeMagicLink(dto.token);
  }

  @Post('oauth/:provider')
  oauth(@Param('provider') _provider: string) {
    return this.authService.requestMagicLink('');
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout() {
    return this.authService.logout();
  }
}
