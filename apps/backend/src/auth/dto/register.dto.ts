import { IsEmail, IsIn, IsInt, IsString, Min, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsString()
  @MinLength(1)
  phone!: string;

  @IsString()
  @MinLength(1)
  postalCode!: string;

  @IsInt()
  @Min(1)
  searchRadiusKm!: number;

  @IsIn(['fr', 'en'])
  language!: 'fr' | 'en';
}
