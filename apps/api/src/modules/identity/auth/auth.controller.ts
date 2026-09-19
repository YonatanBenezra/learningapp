import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { ConsumeMagicLinkDto } from './dto/consume-magic-link.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestMagicLinkDto } from './dto/request-magic-link.dto';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(
      dto.username,
      dto.email,
      dto.password,
      res,
    );
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.loginWithPassword(dto.login, dto.password, res);
  }

  @Post('magic-link')
  requestMagicLink(@Body() dto: RequestMagicLinkDto) {
    return this.authService.requestMagicLink(dto.email);
  }

  @Post('magic-link/consume')
  consumeMagicLink(
    @Body() dto: ConsumeMagicLinkDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.consumeMagicLink(dto.token, res);
  }

  @Post('oauth/:provider')
  oauth() {
    return this.authService.oauthNotImplemented();
  }

  @Post('refresh')
  refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.refresh(req, res, dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(req, res);
  }
}
