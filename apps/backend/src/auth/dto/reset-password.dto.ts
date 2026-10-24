import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  /** The code from the e-mail; dashes and spaces are tolerated. */
  @IsString()
  @Length(6, 32)
  code!: string;

  @MinLength(8)
  newPassword!: string;
}
