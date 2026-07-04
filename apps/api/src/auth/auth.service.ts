import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import type { User } from '../generated/prisma/client';
import type { UserResponse } from '../domain/contracts';
import { toUserResponse } from '../users/user.mapper';
import type { AccessTokenPayload } from './auth.types';
import type {
  AuthResponse,
  AuthTokensResponse,
} from './contracts/auth.contract';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly passwords: PasswordService,
  ) {}

  async register(input: RegisterDto): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('An account with this email already exists.');
    }

    const user = await this.prisma.user.create({
      data: {
        displayName: input.displayName.trim(),
        email,
        passwordHash: await this.passwords.hash(input.password),
      },
    });
    return {
      user: toUserResponse(user),
      ...(await this.issueTokens(user)),
    };
  }

  async login(input: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.trim().toLowerCase() },
    });
    if (
      !user?.passwordHash ||
      !(await this.passwords.verify(input.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Email or password is incorrect.');
    }
    return {
      user: toUserResponse(user),
      ...(await this.issueTokens(user)),
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokensResponse> {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException(
        'The refresh token is invalid or expired.',
      );
    }

    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(session.user);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: { tokenHash: this.hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getUser(userId: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('The account no longer exists.');
    return toUserResponse(user);
  }

  private async issueTokens(user: User): Promise<AuthTokensResponse> {
    const payload: AccessTokenPayload = {
      email: user.email,
      role: user.role,
      sub: user.id,
    };
    const refreshToken = randomBytes(48).toString('base64url');
    const ttlDays = this.config.getOrThrow<number>('REFRESH_TOKEN_TTL_DAYS');
    await this.prisma.refreshSession.create({
      data: {
        expiresAt: new Date(Date.now() + ttlDays * 86_400_000),
        tokenHash: this.hashToken(refreshToken),
        userId: user.id,
      },
    });
    return {
      accessToken: await this.jwtService.signAsync(payload),
      refreshToken,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
