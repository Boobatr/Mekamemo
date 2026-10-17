import { IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  /** Required unless the account still has its original, never-shown generated password. */
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
