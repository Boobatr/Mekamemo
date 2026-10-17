import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const SALT_ROUNDS = 10;

const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  hasChosenPassword: true,
  fullName: true,
  phone: true,
  postalCode: true,
  searchRadiusKm: true,
  language: true,
  units: true,
  autoContactGarages: true,
  voiceFallbackEnabled: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER_FIELDS,
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    return { ...user, confirmBeforeBooking: true as const };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const taken = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (taken && taken.id !== userId) {
        throw new ConflictException('Un compte existe déjà avec ce courriel.');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: PUBLIC_USER_FIELDS,
    });
    return { ...user, confirmBeforeBooking: true as const };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    // Accounts created before the app had a password field never knew theirs, so
    // they can set one with just their session; everyone else must prove it.
    if (user.hasChosenPassword) {
      const matches = dto.currentPassword
        ? await bcrypt.compare(dto.currentPassword, user.passwordHash)
        : false;
      if (!matches) throw new UnauthorizedException('Mot de passe actuel incorrect.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: await bcrypt.hash(dto.newPassword, SALT_ROUNDS),
        hasChosenPassword: true,
      },
    });
    return { ok: true as const };
  }
}
