import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
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
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: PUBLIC_USER_FIELDS,
    });
    return { ...user, confirmBeforeBooking: true as const };
  }
}
