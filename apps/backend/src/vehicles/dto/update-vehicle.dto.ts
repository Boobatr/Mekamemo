import { IsIn, IsInt, IsOptional, IsString, IsUrl, Length, Min, MinLength } from 'class-validator';

export class UpdateVehicleDto {
  @IsOptional()
  @IsIn(['city', 'highway', 'mixed'])
  usageType?: 'city' | 'highway' | 'mixed';

  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  photoUrl?: string;

  /** Lets a vehicle added without a VIN (manual entry) have it completed later. */
  @IsOptional()
  @IsString()
  @Length(17, 17)
  vin?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  make?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  model?: string;

  @IsOptional()
  @IsString()
  trim?: string;

  @IsOptional()
  @IsInt()
  @Min(1980)
  year?: number;

  @IsOptional()
  @IsString()
  engine?: string;
}
