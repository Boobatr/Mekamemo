import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EMAIL_PROVIDER } from '../quotes/email-provider.interface';
import type { EmailProvider } from '../quotes/email-provider.interface';
import { generateResetCode, hashResetCode, resetCodeMatches } from './password-reset-code';
import { buildPasswordResetEmail, RESET_CODE_TTL_MINUTES } from './password-reset-email';

const SALT_ROUNDS = 10;

const HOUR_MS = 60 * 60 * 1000;
/** Each code allows this many guesses, then a new one must be requested. */
const MAX_CODE_ATTEMPTS = 5;
/** Caps the e-mails one person can trigger for an account, and the total the app will send. */
const MAX_RESET_REQUESTS_PER_USER_PER_HOUR = 3;
const MAX_RESET_REQUESTS_PER_HOUR = 100;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(EMAIL_PROVIDER) private readonly emailProvider: EmailProvider,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec ce courriel.');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        postalCode: dto.postalCode,
        searchRadiusKm: dto.searchRadiusKm,
        language: dto.language,
        subscription: { create: { plan: 'free', status: 'none' } },
      },
    });

    return this.buildAuthResponse(user.id, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Identifiants invalides.');

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException('Identifiants invalides.');

    return this.buildAuthResponse(user.id, user.email);
  }

  /**
   * Sends a one-time code by e-mail. It behaves the same whether or not the address has an
   * account (and doesn't wait for the e-mail to go out), so the endpoint can't be used to find
   * out who is registered.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.findUserByEmail(email);
    if (!user) return;

    const since = new Date(Date.now() - HOUR_MS);
    const [forThisUser, overall] = await Promise.all([
      this.prisma.passwordResetToken.count({ where: { userId: user.id, createdAt: { gte: since } } }),
      this.prisma.passwordResetToken.count({ where: { createdAt: { gte: since } } }),
    ]);
    if (forThisUser >= MAX_RESET_REQUESTS_PER_USER_PER_HOUR || overall >= MAX_RESET_REQUESTS_PER_HOUR) return;

    const code = generateResetCode();
    await this.prisma.$transaction([
      // Only the newest code works.
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          codeHash: hashResetCode(code),
          expiresAt: new Date(Date.now() + RESET_CODE_TTL_MINUTES * 60 * 1000),
        },
      }),
    ]);

    void this.emailProvider
      .send(buildPasswordResetEmail(user, code))
      .catch((err: Error) => this.logger.error(`Could not send the reset code: ${err.message}`));
  }

  /** Checks the e-mailed code, sets the new password and signs the user in. */
  async resetPassword(dto: ResetPasswordDto) {
    const invalid = () => new BadRequestException('Code invalide ou expiré.');

    const user = await this.findUserByEmail(dto.email);
    if (!user) throw invalid();

    const token = await this.prisma.passwordResetToken.findFirst({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!token) throw invalid();

    // Count the guess first, atomically, so parallel requests can't exceed the limit.
    const claimed = await this.prisma.passwordResetToken.updateMany({
      where: { id: token.id, attempts: { lt: MAX_CODE_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    if (claimed.count === 0 || !resetCodeMatches(token.codeHash, dto.code)) throw invalid();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await bcrypt.hash(dto.newPassword, SALT_ROUNDS), hasChosenPassword: true },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return this.buildAuthResponse(user.id, user.email);
  }

  /** The address exactly as registered if possible, else ignoring case ("Marc@x.ca" vs "marc@x.ca"). */
  private async findUserByEmail(email: string) {
    return (
      (await this.prisma.user.findUnique({ where: { email } })) ??
      (await this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } }))
    );
  }

  private buildAuthResponse(userId: string, email: string) {
    const accessToken = this.jwtService.sign({ sub: userId, email });
    return { accessToken, userId };
  }
}
