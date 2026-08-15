import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  postalCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  searchRadiusKm?: number;

  @IsOptional()
  @IsIn(['fr', 'en'])
  language?: 'fr' | 'en';

  @IsOptional()
  @IsIn(['km', 'mi'])
  units?: 'km' | 'mi';

  @IsOptional()
  @IsBoolean()
  autoContactGarages?: boolean;

  @IsOptional()
  @IsBoolean()
  voiceFallbackEnabled?: boolean;
}
