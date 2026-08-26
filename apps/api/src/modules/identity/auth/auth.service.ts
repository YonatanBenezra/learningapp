import {
  Injectable,
  Logger,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider, type User } from '@prisma/client';
import type { Request, Response } from 'express';
import { UserRole } from '../../../common/constants/roles';
import { hashToken, randomToken } from '../../../common/utils/token-hash';
import { ttlToMs } from '../../../common/utils/ttl';
import type { Env } from '../../../core/config/env.schema';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { clearAuthCookies, readCookie, setAuthCookies } from './auth-cookies';
import { MAGIC_LINK_TTL_MS, REFRESH_COOKIE } from './auth.constants';

export type PublicUser = {
  id: string;
  email: string;
  role: UserRole;
  displayName: string | null;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async requestMagicLink(email: string): Promise<{ ok: true; token?: string }> {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.upsert({
      where: { email: normalized },
      create: { email: normalized },
      update: {},
    });
    await this.prisma.identity.upsert({
      where: {
        provider_providerUserId: {
          provider: AuthProvider.magic_link,
          providerUserId: normalized,
        },
      },
      create: {
        userId: user.id,
        provider: AuthProvider.magic_link,
        providerUserId: normalized,
      },
      update: {},
    });

    const token = randomToken();
    await this.prisma.magicLink.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MS),
      },
    });

    if (this.config.get('NODE_ENV', { infer: true }) !== 'production') {
      this.logger.log(`Magic link for ${normalized}: ${token}`);
      return { ok: true, token };
    }
    return { ok: true };
  }

  async consumeMagicLink(
    token: string,
    res: Response,
  ): Promise<{ user: PublicUser }> {
    const user = await this.prisma.$transaction(async (tx) => {
      const link = await tx.magicLink.findFirst({
        where: {
          tokenHash: hashToken(token),
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });
      if (!link || link.user.deletedAt) {
        throw new UnauthorizedException('Invalid or expired magic link');
      }
      await tx.magicLink.update({
        where: { id: link.id },
        data: { consumedAt: new Date() },
      });
      return tx.user.update({
        where: { id: link.userId },
        data: { emailVerified: new Date() },
      });
    });
    return this.issueSession(user, res);
  }

  async refresh(
    req: Request,
    res: Response,
    bodyToken?: string,
  ): Promise<{ user: PublicUser }> {
    const raw = readCookie(req, REFRESH_COOKIE) ?? bodyToken;
    if (!raw) {
      throw new UnauthorizedException();
    }
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(raw) },
      include: { user: true },
    });
    if (
      !record ||
      record.revokedAt ||
      record.expiresAt <= new Date() ||
      record.user.deletedAt
    ) {
      throw new UnauthorizedException();
    }
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    return this.issueSession(record.user, res);
  }

  async logout(req: Request, res: Response): Promise<void> {
    const raw = readCookie(req, REFRESH_COOKIE);
    if (raw) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(raw), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    clearAuthCookies(res, this.cookieFlags());
  }

  oauthNotImplemented(): never {
    throw new NotImplementedException();
  }

  private async issueSession(
    user: User,
    res: Response,
  ): Promise<{ user: PublicUser }> {
    const accessTtl = this.config.get('JWT_ACCESS_TTL', { infer: true });
    const refreshTtl = this.config.get('JWT_REFRESH_TTL', { infer: true });
    const accessMaxAgeMs = ttlToMs(accessTtl);
    const refreshMaxAgeMs = ttlToMs(refreshTtl);

    const refreshToken = randomToken();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + refreshMaxAgeMs),
      },
    });

    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: accessTtl as `${number}m`,
      },
    );

    setAuthCookies(
      res,
      { accessToken, refreshToken },
      { accessMaxAgeMs, refreshMaxAgeMs, ...this.cookieFlags() },
    );

    return { user: this.toPublicUser(user) };
  }

  private cookieFlags() {
    const domain = this.config.get('COOKIE_DOMAIN', { infer: true });
    return {
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      domain: domain === 'localhost' ? undefined : domain,
    };
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      displayName: user.displayName,
    };
  }
}
